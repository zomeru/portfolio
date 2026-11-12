export type LoginActionState = {
  error?: string;
};

export type GenerationActionState = {
  message?: string;
  post?: {
    slug: string;
    title: string;
  };
  status: "error" | "idle" | "success";
};

export type WebhookRegistrationActionState = {
  fieldErrors?: Partial<Record<"destinationType" | "name" | "url", string>>;
  message?: string;
  secret?: string;
  status: "error" | "idle" | "success";
};

export type WebhookMutationActionState = {
  message?: string;
  status: "error" | "idle" | "success";
};

export type NotificationRetryActionState = {
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialLoginState: LoginActionState = {};
export const initialGenerationState: GenerationActionState = { status: "idle" };
export const initialWebhookRegistrationState: WebhookRegistrationActionState = { status: "idle" };
export const initialWebhookMutationState: WebhookMutationActionState = { status: "idle" };
export const initialNotificationRetryState: NotificationRetryActionState = { status: "idle" };
