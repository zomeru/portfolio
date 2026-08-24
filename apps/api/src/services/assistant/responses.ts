export type RecentBlogSummary = {
  publishedAt?: string;
  title: string;
};

export type ExperienceSummary = {
  company?: string;
  location?: string;
  period?: string;
  role?: string;
  technologies?: string[];
  title: string;
};

function escapeMarkdownInline(value: string) {
  return value.replace(/([\\`*_{}[\]()<>])/g, "\\$1");
}

function publishedDate(value: string | undefined) {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
}

export function createRecentBlogListMessage(blogs: readonly RecentBlogSummary[]) {
  if (blogs.length === 0) {
    return "No recent blog posts were returned by the current portfolio index.";
  }

  const introduction =
    blogs.length === 1
      ? "Here is Zomer's most recent indexed blog post:"
      : `Here are Zomer's ${blogs.length} most recent indexed blog posts:`;
  const items = blogs.map((blog, index) => {
    const date = publishedDate(blog.publishedAt);
    return `- **${escapeMarkdownInline(blog.title)}**${date ? ` — published ${date}` : ""} [${index + 1}]`;
  });
  return `${introduction}\n\n${items.join("\n")}`;
}

export function createOldestBlogListMessage(blogs: readonly RecentBlogSummary[]) {
  if (blogs.length === 0) {
    return "No oldest blog posts were returned by the current portfolio index.";
  }

  const introduction =
    blogs.length === 1
      ? "Here is Zomer's oldest indexed blog post:"
      : `Here are Zomer's ${blogs.length} oldest indexed blog posts, oldest first:`;
  const items = blogs.map((blog, index) => {
    const date = publishedDate(blog.publishedAt);
    return `- **${escapeMarkdownInline(blog.title)}**${date ? ` — published ${date}` : ""} [${index + 1}]`;
  });
  return `${introduction}\n\n${items.join("\n")}`;
}

export function createLatestBlogMessage(blog: RecentBlogSummary, direction: "latest" | "oldest") {
  const date = publishedDate(blog.publishedAt);
  return `Zomer's ${direction === "latest" ? "most recent" : "oldest"} indexed blog post is:\n\n- **${escapeMarkdownInline(blog.title)}**${date ? ` — published ${date}` : ""} [1]`;
}

export function createFilteredBlogListMessage(options: {
  blogs: readonly RecentBlogSummary[];
  terms: readonly string[];
  total: number;
}) {
  const topic = options.terms.map(escapeMarkdownInline).join(" and ");
  if (options.total === 0 || options.blogs.length === 0) {
    return `I couldn't find an indexed blog post that mentions **${topic}**.`;
  }

  const scope =
    options.blogs.length < options.total
      ? `I found ${options.total} indexed blog posts mentioning **${topic}**. Here are the first ${options.blogs.length}, newest first:`
      : `I found ${options.total} indexed ${options.total === 1 ? "blog post" : "blog posts"} mentioning **${topic}**:`;
  const items = options.blogs.map((blog, index) => {
    const date = publishedDate(blog.publishedAt);
    return `${index + 1}. **${escapeMarkdownInline(blog.title)}**${date ? ` — published ${date}` : ""} [${index + 1}]`;
  });
  return `${scope}\n\n${items.join("\n")}`;
}

export function createExperienceBoundaryMessage(
  experience: ExperienceSummary,
  direction: "latest" | "oldest",
) {
  const role = experience.role?.trim();
  const company = experience.company?.trim();
  const label =
    role && company
      ? `**${escapeMarkdownInline(role)}** at **${escapeMarkdownInline(company)}**`
      : `**${escapeMarkdownInline(experience.title)}**`;
  const details = [
    experience.period?.trim(),
    experience.location?.trim(),
    experience.technologies?.length
      ? `Technologies: ${experience.technologies.map(escapeMarkdownInline).join(", ")}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const suffix = details.length > 0 ? ` — ${details.join("; ")}` : "";
  return `Zomer's ${direction === "latest" ? "most recent" : "earliest"} indexed work experience is:\n\n- ${label}${suffix} [1]`;
}

export function createBlogCountMessage(count: number) {
  if (count === 0) return "The current portfolio index contains no published blog posts.";
  if (count === 1) return "Zomer has 1 published blog post in the current portfolio index.";
  return `Zomer has ${count} published blog posts in the current portfolio index.`;
}

export function createCompanyCountMessage(count: number) {
  if (count === 0) {
    return "The current portfolio index contains no companies in Zomer's work experience.";
  }
  if (count === 1) {
    return "Zomer has worked for 1 distinct company or organization in the current portfolio index.";
  }
  return `Zomer has worked for ${count} distinct companies or organizations in the current portfolio index.`;
}
