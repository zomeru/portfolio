import { z } from "zod";

import { PUBLIC_API_VERSION } from "./contract";
import {
  publicApiIndexSchema,
  publicBlogPostListSchema,
  publicBlogPostSchema,
  publicErrorSchema,
  publicExperienceListSchema,
  publicProfileSchema,
  publicProjectListSchema,
  publicResumeSchema,
  publicTechStackSchema,
} from "./schemas";

const schema = (value: z.ZodType) => z.toJSONSchema(value, { target: "draft-2020-12" });
const jsonContent = (schemaName: string) => ({
  "application/json": { schema: { $ref: `#/components/schemas/${schemaName}` } },
});
const success = (description: string, schemaName: string) => ({
  description,
  content: jsonContent(schemaName),
});
const error = (description: string) => ({
  description,
  content: jsonContent("Error"),
});

export function getOpenApiDocument(siteUrl: URL) {
  return {
    openapi: "3.2.0",
    info: {
      contact: { name: "Zomer Gregorio", url: new URL("/contact", siteUrl).href },
      description:
        "Anonymous access to published portfolio data and opt-in blog notification subscriptions.",
      title: "Zomer Gregorio Portfolio API",
      version: PUBLIC_API_VERSION,
    },
    externalDocs: {
      description: "Developer resources",
      url: new URL("/developers", siteUrl).href,
    },
    servers: [{ description: "Canonical production site", url: siteUrl.href.replace(/\/$/, "") }],
    security: [],
    tags: [
      { description: "API metadata and discovery links.", name: "Discovery" },
      { description: "Published professional portfolio data.", name: "Portfolio" },
      { description: "Published technical writing.", name: "Blog" },
      { description: "Anonymous, opt-in blog notification subscriptions.", name: "Notifications" },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndex",
          responses: { "200": success("API metadata and canonical resources.", "ApiIndex") },
          security: [],
          summary: "Get the public API index",
          tags: ["Discovery"],
        },
      },
      "/api/v1/profile": {
        get: {
          operationId: "getProfile",
          responses: {
            "200": success("Zomer Gregorio's public profile.", "Profile"),
            "404": error("No published profile is available."),
          },
          security: [],
          summary: "Get the public professional profile",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/resume": {
        get: {
          operationId: "getResume",
          responses: {
            "200": success("Structured resume with the canonical PDF URL.", "Resume"),
            "404": error("No published resume source is available."),
          },
          security: [],
          summary: "Get the structured public resume",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/experience": {
        get: {
          operationId: "listExperience",
          responses: {
            "200": success("Published professional experience.", "ExperienceList"),
          },
          security: [],
          summary: "List professional experience",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/projects": {
        get: {
          operationId: "listProjects",
          responses: { "200": success("Published portfolio projects.", "ProjectList") },
          security: [],
          summary: "List published projects",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/blogs": {
        get: {
          operationId: "listBlogPosts",
          parameters: [
            {
              description: "Maximum posts to return.",
              in: "query",
              name: "limit",
              required: false,
              schema: { default: 10, maximum: 50, minimum: 1, type: "integer" },
            },
            {
              description: "Number of posts to skip.",
              in: "query",
              name: "offset",
              required: false,
              schema: { default: 0, minimum: 0, type: "integer" },
            },
          ],
          responses: {
            "200": success("A bounded page of published blog posts.", "BlogPostList"),
            "400": error("The pagination parameters are invalid."),
          },
          security: [],
          summary: "List published blog posts",
          tags: ["Blog"],
        },
      },
      "/api/v1/blogs/{slug}": {
        get: {
          operationId: "getBlogPost",
          parameters: [
            {
              description: "Canonical Sanity blog slug.",
              in: "path",
              name: "slug",
              required: true,
              schema: {
                maxLength: 200,
                minLength: 1,
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                type: "string",
              },
            },
          ],
          responses: {
            "200": success("One published blog post including its Markdown body.", "BlogPost"),
            "400": error("The slug is invalid."),
            "404": error("No published blog post has the requested slug."),
          },
          security: [],
          summary: "Get a published blog post",
          tags: ["Blog"],
        },
      },
      "/api/v1/tech-stack": {
        get: {
          operationId: "getTechStack",
          responses: { "200": success("Published technology groups.", "TechStack") },
          security: [],
          summary: "Get the current technology stack",
          tags: ["Portfolio"],
        },
      },
      "/api/notifications/email/subscribe": {
        post: {
          operationId: "subscribeToBlogEmail",
          requestBody: { required: true, content: jsonContent("EmailSubscriptionRequest") },
          responses: {
            "200": success(
              "Confirmation requested or subscription already exists.",
              "EmailSubscriptionResult",
            ),
            "400": error("The email address is invalid."),
            "413": error("The request body is too large."),
            "429": error("The subscription rate limit was exceeded."),
            "502": error("The email provider could not complete the request."),
            "503": error("Email notifications are not configured."),
          },
          security: [],
          summary: "Request a double-opt-in email subscription",
          tags: ["Notifications"],
        },
      },
      "/api/notifications/email/confirm": {
        get: {
          operationId: "confirmBlogEmailSubscription",
          parameters: [
            {
              description: "Single-use confirmation token from the confirmation email.",
              in: "query",
              name: "token",
              required: true,
              schema: { maxLength: 256, minLength: 32, type: "string" },
            },
          ],
          responses: {
            "303": { description: "Redirect to the blog list with confirmation status." },
          },
          security: [],
          summary: "Confirm an email subscription",
          tags: ["Notifications"],
        },
      },
      "/api/notifications/email/unsubscribe": {
        post: {
          operationId: "unsubscribeFromBlogEmail",
          parameters: [
            {
              description: "Signed unsubscribe token from a blog email.",
              in: "query",
              name: "token",
              required: true,
              schema: { maxLength: 256, minLength: 32, type: "string" },
            },
          ],
          responses: {
            "200": success("The email subscription was disabled.", "UnsubscribeResult"),
            "400": error("The unsubscribe token is invalid."),
          },
          security: [],
          summary: "Unsubscribe from blog email",
          tags: ["Notifications"],
        },
      },
      "/api/notifications/push/config": {
        get: {
          operationId: "getBlogPushConfiguration",
          responses: {
            "200": success("Public Web Push configuration and feature availability.", "PushConfig"),
          },
          security: [],
          summary: "Get public Web Push configuration",
          tags: ["Notifications"],
        },
      },
      "/api/notifications/push/subscribe": {
        post: {
          operationId: "subscribeToBlogPush",
          requestBody: { required: true, content: jsonContent("PushSubscriptionRequest") },
          responses: {
            "200": success("The browser subscription was upserted.", "PushSubscriptionResult"),
            "400": error("The Web Push subscription is invalid."),
            "413": error("The request body is too large."),
            "429": error("The subscription rate limit was exceeded."),
            "502": error("The push service could not complete the request."),
            "503": error("Web Push notifications are not configured."),
          },
          security: [],
          summary: "Subscribe a browser to blog push",
          tags: ["Notifications"],
        },
      },
      "/api/notifications/push/unsubscribe": {
        delete: {
          operationId: "unsubscribeFromBlogPush",
          requestBody: { required: true, content: jsonContent("PushUnsubscribeRequest") },
          responses: {
            "200": success("The browser subscription was disabled.", "UnsubscribeResult"),
            "400": error("The Web Push endpoint is invalid."),
            "413": error("The request body is too large."),
          },
          security: [],
          summary: "Unsubscribe a browser from blog push",
          tags: ["Notifications"],
        },
      },
    },
    components: {
      schemas: {
        ApiIndex: schema(publicApiIndexSchema),
        BlogPost: schema(publicBlogPostSchema),
        BlogPostList: schema(publicBlogPostListSchema),
        EmailSubscriptionRequest: {
          additionalProperties: false,
          properties: { email: { format: "email", maxLength: 320, type: "string" } },
          required: ["email"],
          type: "object",
        },
        EmailSubscriptionResult: {
          additionalProperties: false,
          properties: {
            success: { const: true, type: "boolean" },
            status: {
              enum: [
                "confirmation_required",
                "confirmation_pending",
                "already_subscribed",
                "suppressed",
              ],
              type: "string",
            },
          },
          required: ["success", "status"],
          type: "object",
        },
        Error: schema(publicErrorSchema),
        ExperienceList: schema(publicExperienceListSchema),
        Profile: schema(publicProfileSchema),
        ProjectList: schema(publicProjectListSchema),
        PushConfig: {
          additionalProperties: false,
          properties: {
            enabled: { type: "boolean" },
            publicKey: { type: ["string", "null"] },
          },
          required: ["enabled", "publicKey"],
          type: "object",
        },
        PushSubscriptionRequest: {
          additionalProperties: false,
          properties: {
            endpoint: { format: "uri", maxLength: 2048, type: "string" },
            keys: {
              additionalProperties: false,
              properties: {
                auth: { maxLength: 512, minLength: 16, type: "string" },
                p256dh: { maxLength: 1024, minLength: 40, type: "string" },
              },
              required: ["auth", "p256dh"],
              type: "object",
            },
          },
          required: ["endpoint", "keys"],
          type: "object",
        },
        PushSubscriptionResult: {
          additionalProperties: false,
          properties: {
            success: { const: true, type: "boolean" },
            status: { const: "subscribed", type: "string" },
          },
          required: ["success", "status"],
          type: "object",
        },
        PushUnsubscribeRequest: {
          additionalProperties: false,
          properties: { endpoint: { format: "uri", maxLength: 2048, type: "string" } },
          required: ["endpoint"],
          type: "object",
        },
        Resume: schema(publicResumeSchema),
        TechStack: schema(publicTechStackSchema),
        UnsubscribeResult: {
          additionalProperties: false,
          properties: {
            success: { const: true, type: "boolean" },
            status: { const: "unsubscribed", type: "string" },
          },
          required: ["success", "status"],
          type: "object",
        },
      },
    },
  } as const;
}
