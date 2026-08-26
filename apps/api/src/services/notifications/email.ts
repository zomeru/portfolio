import type { StoredBlogPublishedEvent } from "@portfolio/database";
import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { NotificationDeliveryError } from "./errors";

const SITE_NAME = "Zomer Gregorio";

type GmailClient = {
  provider: "gmail";
  client: nodemailer.Transporter;
  from: string;
  replyTo?: string;
};

type ResendClient = {
  provider: "resend";
  client: Resend;
  from: string;
  replyTo?: string;
};

type EmailClient = ResendClient | GmailClient;

let gmailTransporter: nodemailer.Transporter | undefined;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailFrame(content: string, preheader: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeHtml(preheader)}</title>
  </head>
  <body style="margin:0;background:#fafafa;color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #e4e4e7;background:#ffffff;">
            <tr><td style="padding:28px 28px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#52525b;">${SITE_NAME}</td></tr>
            <tr><td style="padding:16px 28px 30px;">${content}</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717a;">Software engineering, architecture, tooling, and AI.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, url: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
  <tr><td style="background:#0a0a0a;border-radius:6px;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;color:#fafafa;text-decoration:none;font-size:14px;font-weight:600;">${escapeHtml(label)}</a></td></tr>
</table>`;
}

function getGmailTransporter(environment: ReturnType<typeof getNotificationsServerEnv>) {
  if (gmailTransporter) {
    return gmailTransporter;
  }

  if (!environment.EMAIL_FROM || !environment.GOOGLE_APP_PASSWORD) {
    return null;
  }

  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: environment.EMAIL_FROM,
      pass: environment.GOOGLE_APP_PASSWORD,
    },
  });

  return gmailTransporter;
}

function getEmailClient(): EmailClient | null {
  const environment = getNotificationsServerEnv();
  if (!environment.EMAIL_FROM) return null;
  const emailFrom = `${environment.EMAIL_FROM_NAME} <${environment.EMAIL_FROM}>`;

  switch (environment.EMAIL_PROVIDER) {
    case "gmail": {
      const transporter = getGmailTransporter(environment);

      if (!transporter) {
        return null;
      }

      return {
        provider: "gmail",
        client: transporter,
        from: emailFrom,
        replyTo: environment.EMAIL_REPLY_TO,
      } as GmailClient;
    }

    case "resend": {
      if (!environment.RESEND_API_KEY) {
        return null;
      }

      return {
        provider: "resend",
        client: new Resend(environment.RESEND_API_KEY),
        from: emailFrom,
        replyTo: environment.EMAIL_REPLY_TO,
      } as ResendClient;
    }

    default: {
      return null;
    }
  }
}

export function isEmailConfigured() {
  return Boolean(getEmailClient());
}

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  headers?: Record<string, string>;
}) {
  const config = getEmailClient();
  if (!config) {
    throw new NotificationDeliveryError("Email delivery is not configured.", {
      code: "EMAIL_NOT_CONFIGURED",
      retryable: false,
    });
  }
  if (config.provider === "gmail") {
    try {
      const info = await config.client.sendMail({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(config.replyTo ? { replyTo: config.replyTo } : {}),
        ...(options.headers ? { headers: options.headers } : {}),
      });

      return info.messageId;
    } catch (error) {
      throw new NotificationDeliveryError("The Gmail provider rejected the request.", {
        cause: error,
        code: "EMAIL_GMAIL_SEND_FAILED",
        retryable: true,
      });
    }
  }

  const { data, error } = await config.client.emails.send(
    {
      from: config.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(config.replyTo ? { replyTo: config.replyTo } : {}),
      ...(options.headers ? { headers: options.headers } : {}),
    },
    {
      idempotencyKey: options.idempotencyKey.slice(0, 256),
    },
  );

  if (error) {
    const status =
      "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined;

    throw new NotificationDeliveryError("The email provider rejected the request.", {
      cause: Object.assign(new Error(error.message), { name: error.name }),
      code: `EMAIL_${error.name.toUpperCase().replaceAll(" ", "_")}`,
      ...(status ? { httpStatus: status } : {}),
      retryable:
        status === undefined || status === 408 || status === 409 || status === 429 || status >= 500,
    });
  }

  if (!data?.id) {
    throw new NotificationDeliveryError("The email provider returned no delivery identifier.", {
      code: "EMAIL_EMPTY_RESPONSE",
    });
  }

  return data.id;
}

export async function sendSubscriptionConfirmationEmail(options: {
  email: string;
  confirmationUrl: string;
  subscriptionId: string;
  tokenHash: string;
}) {
  const heading = "Confirm your blog subscription";
  const html = emailFrame(
    `<h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:600;">${heading}</h1>
<p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#52525b;">Confirm this address to receive a short email whenever I publish a new post.</p>
${button("Confirm subscription", options.confirmationUrl)}
<p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">This link expires in 24 hours. If you did not request it, you can ignore this email.</p>`,
    heading,
  );
  const text = `${heading}\n\nConfirm this address to receive a short email whenever I publish a new post.\n\n${options.confirmationUrl}\n\nThis link expires in 24 hours. If you did not request it, ignore this email.`;
  return sendEmail({
    to: options.email,
    subject: heading,
    html,
    text,
    idempotencyKey: `subscription-confirmation/${options.subscriptionId}/${options.tokenHash}`,
  });
}

export async function sendBlogPublishedEmail(options: {
  deliveryId: string;
  email: string;
  event: StoredBlogPublishedEvent;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
}) {
  const blog = options.event.data.blog;
  const publicationDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(blog.publishedAt));
  const excerpt = blog.excerpt
    ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#52525b;">${escapeHtml(blog.excerpt)}</p>`
    : "";
  const html = emailFrame(
    `<p style="margin:0 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#71717a;">New blog · ${escapeHtml(publicationDate)}</p>
<h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:600;">${escapeHtml(blog.title)}</h1>
${excerpt}
${button("Read the post", blog.url)}
<p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">Canonical URL: <a href="${escapeHtml(blog.url)}" style="color:#52525b;word-break:break-all;">${escapeHtml(blog.url)}</a></p>
<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717a;"><a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#52525b;">Unsubscribe from blog emails</a></p>`,
    `New post: ${blog.title}`,
  );
  const text = `New blog from ${SITE_NAME}\n\n${blog.title}\n${publicationDate}${blog.excerpt ? `\n\n${blog.excerpt}` : ""}\n\nRead the post: ${blog.url}\n\nUnsubscribe: ${options.unsubscribeUrl}`;
  return sendEmail({
    to: options.email,
    subject: blog.title,
    html,
    text,
    idempotencyKey: `blog-published/${options.deliveryId}`,
    headers: {
      "List-Unsubscribe": `<${options.oneClickUnsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
