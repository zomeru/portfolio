import { ApiError } from "../../errors";
import { log } from "../../lib/log";
import { generateBlogDraft } from "./draft";
import {
  type BlogGenerationTrigger,
  createGeneratedBlogPost,
  getGenerationContext,
  type PublishedBlogPost,
} from "./repository";

type GenerationResult = {
  created: boolean;
  post: PublishedBlogPost;
};

const inFlightGenerations = new Map<string, Promise<GenerationResult>>();

function normalizeTitle(value: string) {
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.join(" ") ?? ""
  );
}

async function generateAndPublish(input: {
  generationKey: string;
  trigger: BlogGenerationTrigger;
}): Promise<GenerationResult> {
  const initialContext = await getGenerationContext(input.generationKey);

  if (initialContext.existing) {
    return { created: false, post: initialContext.existing };
  }

  const draft = await generateBlogDraft();
  const refreshedContext = await getGenerationContext(input.generationKey);

  if (refreshedContext.existing) {
    return { created: false, post: refreshedContext.existing };
  }

  const duplicate = refreshedContext.identifiers.find(
    (post) =>
      post.slug === draft.slug || normalizeTitle(post.title) === normalizeTitle(draft.title),
  );

  if (duplicate) {
    throw new ApiError("The generated article duplicates an existing post.", {
      code: "BLOG_DUPLICATE",
      status: 409,
    });
  }

  const post = await createGeneratedBlogPost({ ...input, draft });

  log("info", "generated blog post published", {
    postId: post._id,
    slug: post.slug.current,
    trigger: input.trigger,
  });

  return { created: true, post };
}

export function generateAndPublishBlog(input: {
  generationKey: string;
  trigger: BlogGenerationTrigger;
}) {
  const current = inFlightGenerations.get(input.generationKey);
  if (current) return current;

  const generation = generateAndPublish(input).finally(() => {
    inFlightGenerations.delete(input.generationKey);
  });
  inFlightGenerations.set(input.generationKey, generation);
  return generation;
}
