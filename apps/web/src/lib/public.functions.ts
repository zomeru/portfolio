import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slug = z.string().min(1).max(256);

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { listPublicExperience } = await import("@portfolio/api/public-portfolio");
  return listPublicExperience();
});

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { listPublicProjects } = await import("@portfolio/api/public-portfolio");
  return listPublicProjects();
});

export const getProject = createServerFn({ method: "GET" })
  .validator(slug)
  .handler(async ({ data }) => {
    const { getPublicProject } = await import("@portfolio/api/public-portfolio");
    const project = await getPublicProject(data);
    if (!project) throw notFound();
    return project;
  });

export const getExperience = createServerFn({ method: "GET" })
  .validator(slug)
  .handler(async ({ data }) => {
    const { getPublicExperience } = await import("@portfolio/api/public-portfolio");
    const experience = await getPublicExperience(data);
    if (!experience) throw notFound();
    return experience;
  });

export const POSTS_PER_PAGE = 10;

export const getBlogList = createServerFn({ method: "GET" })
  .validator(
    z
      .number()
      .int()
      .min(1)
      .max(Math.floor(Number.MAX_SAFE_INTEGER / POSTS_PER_PAGE)),
  )
  .handler(async ({ data: requestedPage }) => {
    const { listPublicBlogPosts } = await import("@portfolio/api/public-portfolio");
    const list = (page: number) =>
      listPublicBlogPosts({ limit: POSTS_PER_PAGE, offset: (page - 1) * POSTS_PER_PAGE });
    const requested = await list(requestedPage);
    const totalPages = Math.max(1, Math.ceil(requested.total / POSTS_PER_PAGE));
    const currentPage = Math.min(requestedPage, totalPages);
    const pageData = currentPage === requestedPage ? requested : await list(currentPage);
    return { currentPage, totalPages, pageData };
  });

export const getBlog = createServerFn({ method: "GET" })
  .validator(slug)
  .handler(async ({ data }) => {
    const { getPublicBlogPost } = await import("@portfolio/api/public-portfolio");
    const { renderMarkdown } = await import("@/lib/markdown.server");
    const post = await getPublicBlogPost(data);
    if (!post) throw notFound();
    const { body, ...summary } = post;
    return { ...summary, html: await renderMarkdown(body) };
  });

export const getDevelopers = createServerFn({ method: "GET" })
  .validator(z.enum(["en", "ja", "zh-CN", "de"]))
  .handler(async ({ data: locale }) => {
    const { getSiteEnv } = await import("@portfolio/env/site");
    const { getDeveloperGuideMarkdown } = await import("@/lib/developer-docs");
    const { renderMarkdown } = await import("@/lib/markdown.server");
    const { getTranslations } = await import("@/i18n/server");
    const t = await getTranslations({ locale, namespace: "Common" });
    return renderMarkdown(
      getDeveloperGuideMarkdown(new URL(getSiteEnv().siteUrl)),
      t("opensNewTab"),
    );
  });
