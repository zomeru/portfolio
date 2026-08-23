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

export type ReindexActionState = {
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialLoginState: LoginActionState = {};
export const initialGenerationState: GenerationActionState = { status: "idle" };
export const initialReindexState: ReindexActionState = { status: "idle" };
