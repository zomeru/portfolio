import { getSiteEnv } from "@portfolio/env/site";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import { getPublicApiIndex } from "../services/public-portfolio/discovery";
import {
  getPublicPortfolioService,
  type PublicPortfolioService,
} from "../services/public-portfolio/service";
import type { ApiEnv } from "../types/hono";

const PUBLIC_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=3600";
const blogQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
const blogSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

type PublicApiDependencies = {
  service: PublicPortfolioService;
  siteUrl: URL;
};

function publicError(code: string, message: string, resolution: string, requestId: string) {
  return { error: { code, message, resolution }, requestId };
}

export function createPublicApiRoutes(dependencies: PublicApiDependencies) {
  return new Hono<ApiEnv>()
    .use(
      "*",
      cors({
        allowHeaders: ["Content-Type"],
        allowMethods: ["GET", "HEAD", "OPTIONS"],
        maxAge: 86_400,
        origin: "*",
      }),
    )
    .use("*", async (c, next) => {
      await next();
      c.header("Cache-Control", PUBLIC_CACHE_CONTROL);
    })
    .get("/", (c) => c.json(getPublicApiIndex(dependencies.siteUrl)))
    .get("/profile", async (c) => {
      const profile = await dependencies.service.getProfile();
      if (profile) return c.json(profile);
      return c.json(
        publicError(
          "RESOURCE_NOT_FOUND",
          "No published profile is available.",
          "Fetch /api/v1 for the current resource index.",
          c.get("requestId"),
        ),
        404,
      );
    })
    .get("/resume", async (c) => {
      const resume = await dependencies.service.getResume();
      if (resume) return c.json(resume);
      return c.json(
        publicError(
          "RESOURCE_NOT_FOUND",
          "No published resume source is available.",
          "Fetch /api/v1/profile to inspect the current public profile.",
          c.get("requestId"),
        ),
        404,
      );
    })
    .get("/experience", async (c) => c.json(await dependencies.service.listExperience()))
    .get("/projects", async (c) => c.json(await dependencies.service.listProjects()))
    .get("/blogs", async (c) => {
      const query = blogQuerySchema.safeParse(c.req.query());
      if (!query.success) {
        return c.json(
          publicError(
            "INVALID_QUERY",
            "The blog pagination parameters are invalid.",
            "Use integer limit=1..50 and offset=0 or greater.",
            c.get("requestId"),
          ),
          400,
        );
      }
      return c.json(await dependencies.service.listBlogPosts(query.data));
    })
    .get("/blogs/:slug", async (c) => {
      const slug = blogSlugSchema.safeParse(c.req.param("slug"));
      if (!slug.success) {
        return c.json(
          publicError(
            "INVALID_SLUG",
            "The blog slug is invalid.",
            "Use the canonical slug returned by /api/v1/blogs.",
            c.get("requestId"),
          ),
          400,
        );
      }

      const post = await dependencies.service.getBlogPost(slug.data);
      if (post) return c.json(post);
      return c.json(
        publicError(
          "RESOURCE_NOT_FOUND",
          `No published blog post exists at slug ${slug.data}.`,
          "Fetch /api/v1/blogs for the current list of canonical slugs.",
          c.get("requestId"),
        ),
        404,
      );
    })
    .get("/tech-stack", async (c) => c.json(await dependencies.service.listTechStack()))
    .all("*", (c) =>
      c.json(
        publicError(
          "RESOURCE_NOT_FOUND",
          `The public API resource ${c.req.path} does not exist.`,
          "Fetch /api/v1 for the resource index or /openapi.json for the complete contract.",
          c.get("requestId"),
        ),
        404,
      ),
    );
}

export const publicApiRoutes = createPublicApiRoutes({
  service: getPublicPortfolioService(),
  siteUrl: new URL(getSiteEnv().siteUrl),
});
