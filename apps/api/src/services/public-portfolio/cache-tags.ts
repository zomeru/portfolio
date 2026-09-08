const SLUGGED_TYPES = new Set(["experience", "project", "blogPost"]);

export const PROFILE_CACHE_TAG = "profile";
export const EXPERIENCE_CACHE_TAG = "experience";
export const PROJECT_CACHE_TAG = "project";
export const BLOG_POST_CACHE_TAG = "blogPost";
export const TECH_STACK_CACHE_TAG = "techStack";

export function sanitySlugTag(type: string, slug: string) {
  return `${type}:${slug}`;
}

export function blogPostCacheTag(slug: string) {
  return sanitySlugTag(BLOG_POST_CACHE_TAG, slug);
}

export type SanityCacheInvalidation = {
  _type: "profile" | "experience" | "project" | "blogPost" | "techStack";
  previousSlug?: string | null | undefined;
  slug?: string | null | undefined;
};

function addSlugTag(tags: Set<string>, type: string, slug: string | null | undefined) {
  if (SLUGGED_TYPES.has(type) && slug) tags.add(sanitySlugTag(type, slug));
}

export function getSanityCacheTags(payload: SanityCacheInvalidation) {
  const tags = new Set<string>([payload._type]);
  addSlugTag(tags, payload._type, payload.slug);
  addSlugTag(tags, payload._type, payload.previousSlug);
  return [...tags];
}

export function getBlogPostCacheTags(slug?: string | null) {
  return getSanityCacheTags({ _type: "blogPost", slug });
}
