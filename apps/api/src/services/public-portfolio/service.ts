import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";
import { getSiteEnv } from "@portfolio/env/site";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";

import {
  portableTextToDetailSections,
  portableTextToParagraphs,
  portableTextToPlainText,
} from "./portable-text";
import {
  PUBLIC_BLOG_POST_LIST_QUERY,
  PUBLIC_BLOG_POST_QUERY,
  PUBLIC_EXPERIENCE_LIST_QUERY,
  PUBLIC_EXPERIENCE_QUERY,
  PUBLIC_PROFILE_QUERY,
  PUBLIC_PROJECT_LIST_QUERY,
  PUBLIC_PROJECT_QUERY,
  PUBLIC_TECH_STACK_QUERY,
} from "./queries";
import {
  type PublicBlogPost,
  type PublicBlogPostList,
  type PublicBlogPostSummary,
  type PublicExperience,
  type PublicExperienceList,
  type PublicPhoto,
  type PublicProfile,
  type PublicProject,
  type PublicProjectList,
  type PublicResume,
  type PublicTechStack,
  type PublicTechStackGroup,
  publicBlogPostListSchema,
  publicBlogPostSchema,
  publicExperienceListSchema,
  publicProfileSchema,
  publicProjectListSchema,
  publicResumeSchema,
  publicTechStackSchema,
} from "./schemas";

const SANITY_API_VERSION = "2026-08-20";
const SANITY_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_RESUME_PATH = "/assets/GREGORIO_ZOMER_RESUME.pdf";

const rawPhotoSchema = z
  .object({
    alt: z.string().nullable(),
    asset: z
      .object({
        metadata: z
          .object({
            dimensions: z
              .object({ height: z.number().nullable(), width: z.number().nullable() })
              .nullable(),
            lqip: z.string().nullable(),
          })
          .nullable(),
        url: z.string().nullable(),
      })
      .nullable(),
  })
  .nullable();

const rawProfileSchema = z
  .object({
    aboutContent: z.unknown(),
    biography: z.unknown(),
    email: z.string().nullable(),
    githubUrl: z.string().nullable(),
    linkedinUrl: z.string().nullable(),
    name: z.string().nullable(),
    photo: rawPhotoSchema,
    resumeUrl: z.string().nullable(),
    role: z.string().nullable(),
  })
  .nullable();

const rawExperienceSchema = z.object({
  company: z.string().nullable(),
  companyUrl: z.string().nullable(),
  details: z.unknown(),
  location: z.string().nullable(),
  period: z.string().nullable(),
  responsibilities: z.unknown(),
  role: z.string().nullable(),
  slug: z.string().nullable(),
  summary: z.string().nullable(),
  technologies: z.array(z.string()).nullable(),
  updatedAt: z.string(),
});

const rawProjectSchema = z.object({
  caseStudyUrl: z.string().nullable(),
  demoUrl: z.string().nullable(),
  description: z.string().nullable(),
  details: z.unknown(),
  image: rawPhotoSchema,
  repositoryUrl: z.string().nullable(),
  slug: z.string().nullable(),
  technologies: z.array(z.string()).nullable(),
  title: z.string().nullable(),
  updatedAt: z.string(),
  year: z.string().nullable(),
});

const rawBlogSummarySchema = z.object({
  date: z.string().nullable(),
  description: z.string().nullable(),
  slug: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  title: z.string().nullable(),
});

const rawBlogPostSchema = rawBlogSummarySchema.extend({
  body: z.string().nullable(),
  readTime: z.number().nullable(),
  updatedAt: z.string().nullable(),
});

const rawTechStackSchema = z.object({
  items: z.array(z.string()).nullable(),
  name: z.string().nullable(),
});

const rawSnapshotSchema = z.object({
  blogs: z.array(rawBlogSummarySchema),
  experience: z.array(rawExperienceSchema),
  profile: rawProfileSchema,
  projects: z.array(rawProjectSchema),
  techStack: z.array(rawTechStackSchema),
});

type RawSnapshot = z.infer<typeof rawSnapshotSchema>;
type RawBlogPost = z.infer<typeof rawBlogPostSchema>;

export type PublicPortfolioSnapshot = {
  blogs: PublicBlogPostSummary[];
  experience: PublicExperience[];
  profile: PublicProfile | null;
  projects: PublicProject[];
  techStack: PublicTechStackGroup[];
};

export type PublicBlogPostListOptions = {
  limit?: number;
  offset?: number;
  query?: string;
};

export type PublicPortfolioService = {
  getBlogPost(slug: string): Promise<PublicBlogPost | null>;
  getExperience(slug: string): Promise<PublicExperience | null>;
  getProfile(): Promise<PublicProfile | null>;
  getProject(slug: string): Promise<PublicProject | null>;
  getResume(): Promise<PublicResume | null>;
  getSnapshot(): Promise<PublicPortfolioSnapshot>;
  listBlogPosts(options?: PublicBlogPostListOptions): Promise<PublicBlogPostList>;
  listExperience(): Promise<PublicExperienceList>;
  listProjects(): Promise<PublicProjectList>;
  listTechStack(): Promise<PublicTechStack>;
};

type ServiceDependencies = {
  fetchBlogPost(slug: string): Promise<unknown>;
  fetchBlogPosts?(): Promise<unknown>;
  fetchExperience?(slug: string): Promise<unknown>;
  fetchExperienceList?(): Promise<unknown>;
  fetchProfile?(): Promise<unknown>;
  fetchProject?(slug: string): Promise<unknown>;
  fetchProjectList?(): Promise<unknown>;
  fetchSnapshot?(): Promise<unknown>;
  fetchTechStack?(): Promise<unknown>;
  siteUrl: URL;
};

let sanityClient: SanityClient | undefined;

function getReadClient() {
  if (sanityClient) return sanityClient;

  const sanity = getSanityEnv();
  const server = getSanityServerEnv();
  sanityClient = createClient({
    apiVersion: SANITY_API_VERSION,
    dataset: sanity.dataset,
    perspective: "published",
    projectId: sanity.projectId,
    token: server.token,
    timeout: SANITY_REQUEST_TIMEOUT_MS,
    maxRetries: 2,
    // Next.js owns the durable cache. Reading from the Content Lake API after invalidation avoids
    // repopulating it with a briefly stale CDN response immediately after a publish webhook.
    useCdn: false,
  });

  return sanityClient;
}

type NextSanityFetchOptions = {
  cache: "force-cache";
  next: {
    revalidate: false;
    tags: string[];
  };
};

function fetchWithNextCache(query: string, params: Record<string, unknown>, tags: string[]) {
  // @sanity/client supports Next.js fetch options at runtime. This package deliberately omits DOM
  // types, so keep the framework-specific RequestInit extension isolated at this boundary.
  const fetch = getReadClient().fetch.bind(getReadClient()) as (
    query: string,
    params: Record<string, unknown>,
    options: NextSanityFetchOptions,
  ) => Promise<unknown>;

  return fetch(query, params, {
    // Next.js 16 does not cache fetches by default. Make the Data Cache opt-in explicit rather
    // than relying only on the equivalent indefinite revalidation setting.
    cache: "force-cache",
    next: {
      // Published CMS content is invalidated by the signed Sanity webhook. Avoid tying every
      // static route to a timer when the underlying content has not changed.
      revalidate: false,
      tags,
    },
  });
}

function fetchBlogPost(slug: string) {
  return fetchWithNextCache(PUBLIC_BLOG_POST_QUERY, { slug }, [`blogPost:${slug}`]);
}

function fetchBlogPosts() {
  return fetchWithNextCache(PUBLIC_BLOG_POST_LIST_QUERY, {}, ["blogPost"]);
}

function fetchExperience(slug: string) {
  return fetchWithNextCache(PUBLIC_EXPERIENCE_QUERY, { slug }, [`experience:${slug}`]);
}

function fetchExperienceList() {
  return fetchWithNextCache(PUBLIC_EXPERIENCE_LIST_QUERY, {}, ["experience"]);
}

function fetchProfile() {
  return fetchWithNextCache(PUBLIC_PROFILE_QUERY, {}, ["profile"]);
}

function fetchProject(slug: string) {
  return fetchWithNextCache(PUBLIC_PROJECT_QUERY, { slug }, [`project:${slug}`]);
}

function fetchProjectList() {
  return fetchWithNextCache(PUBLIC_PROJECT_LIST_QUERY, {}, ["project"]);
}

function fetchTechStack() {
  return fetchWithNextCache(PUBLIC_TECH_STACK_QUERY, {}, ["techStack"]);
}

function cleanString(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function cleanStringList(value: string[] | null | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function slugifySegment(value: string) {
  return value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function publicSlug(value: string | null, fallback: string) {
  const candidate = cleanString(value);
  return candidate && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)
    ? candidate
    : slugifySegment(fallback);
}

function toPublicPhoto(photo: z.infer<typeof rawPhotoSchema>): PublicPhoto | null {
  const url = cleanString(photo?.asset?.url);
  const alt = cleanString(photo?.alt);
  if (!url || !alt) return null;

  return {
    alt,
    height: photo?.asset?.metadata?.dimensions?.height ?? null,
    lqip: cleanString(photo?.asset?.metadata?.lqip),
    url,
    width: photo?.asset?.metadata?.dimensions?.width ?? null,
  };
}

function toPublicProfile(
  profile: z.infer<typeof rawProfileSchema>,
  siteUrl: URL,
): PublicProfile | null {
  const name = cleanString(profile?.name);
  const role = cleanString(profile?.role);
  const email = cleanString(profile?.email);
  const github = cleanString(profile?.githubUrl);
  const linkedin = cleanString(profile?.linkedinUrl);
  if (!name || !role || !email || !github || !linkedin) return null;

  const resumePdfUrl = new URL(cleanString(profile?.resumeUrl) ?? DEFAULT_RESUME_PATH, siteUrl)
    .href;

  return publicProfileSchema.parse({
    about: portableTextToPlainText(profile?.aboutContent),
    biography: portableTextToPlainText(profile?.biography),
    email,
    links: {
      email: `mailto:${email}`,
      github,
      linkedin,
      resume: resumePdfUrl,
      website: siteUrl.href,
    },
    name,
    photo: toPublicPhoto(profile?.photo ?? null),
    resumePdfUrl,
    role,
    url: siteUrl.href,
  });
}

function toPublicExperience(raw: RawSnapshot["experience"][number], siteUrl: URL) {
  const company = cleanString(raw.company);
  const period = cleanString(raw.period);
  const role = cleanString(raw.role);
  const slug = company ? publicSlug(raw.slug, company) : "";
  if (!company || !period || !role || !slug) return null;

  return {
    canonicalUrl: new URL(`/work/${slug}`, siteUrl).href,
    company,
    companyUrl: cleanString(raw.companyUrl),
    details: portableTextToDetailSections(raw.details),
    location: cleanString(raw.location),
    period,
    responsibilities: portableTextToParagraphs(raw.responsibilities),
    role,
    slug,
    summary: cleanString(raw.summary),
    technologies: cleanStringList(raw.technologies),
    updatedAt: raw.updatedAt,
  } satisfies PublicExperience;
}

function toPublicProject(raw: RawSnapshot["projects"][number], siteUrl: URL) {
  const description = cleanString(raw.description);
  const title = cleanString(raw.title);
  const year = cleanString(raw.year);
  const slug = title ? publicSlug(raw.slug, title) : "";
  if (!description || !title || !year || !slug) return null;

  return {
    canonicalUrl: new URL(`/projects/${slug}`, siteUrl).href,
    caseStudyUrl: cleanString(raw.caseStudyUrl),
    demoUrl: cleanString(raw.demoUrl),
    description,
    details: portableTextToDetailSections(raw.details),
    image: toPublicPhoto(raw.image),
    repositoryUrl: cleanString(raw.repositoryUrl),
    slug,
    technologies: cleanStringList(raw.technologies),
    title,
    updatedAt: raw.updatedAt,
    year,
  } satisfies PublicProject;
}

function toPublicBlogSummary(
  raw: RawSnapshot["blogs"][number],
  siteUrl: URL,
): PublicBlogPostSummary | null {
  const date = cleanString(raw.date);
  const slug = cleanString(raw.slug);
  const title = cleanString(raw.title);
  if (!date || !slug || !title) return null;

  return {
    canonicalUrl: new URL(`/blogs/${slug}`, siteUrl).href,
    date,
    description: cleanString(raw.description) ?? "",
    slug,
    tags: cleanStringList(raw.tags),
    title,
  };
}

function toPublicBlogPost(raw: RawBlogPost | null, siteUrl: URL): PublicBlogPost | null {
  if (!raw) return null;
  const summary = toPublicBlogSummary(raw, siteUrl);
  const body = cleanString(raw.body);
  if (!summary || !body) return null;

  return publicBlogPostSchema.parse({
    ...summary,
    body,
    readTimeMinutes: raw.readTime,
    updatedAt: cleanString(raw.updatedAt),
  });
}

function toPublicTechStack(raw: RawSnapshot["techStack"][number]) {
  const name = cleanString(raw.name);
  const items = cleanStringList(raw.items);
  if (!name || items.length === 0) return null;
  return { items, name } satisfies PublicTechStackGroup;
}

export function serializePublicSnapshot(value: unknown, siteUrl: URL): PublicPortfolioSnapshot {
  const raw = rawSnapshotSchema.parse(value);

  return {
    blogs: raw.blogs
      .map((post) => toPublicBlogSummary(post, siteUrl))
      .filter((post): post is PublicBlogPostSummary => Boolean(post)),
    experience: raw.experience
      .map((experience) => toPublicExperience(experience, siteUrl))
      .filter((item): item is PublicExperience => Boolean(item)),
    profile: toPublicProfile(raw.profile, siteUrl),
    projects: raw.projects
      .map((project) => toPublicProject(project, siteUrl))
      .filter((project): project is PublicProject => Boolean(project)),
    techStack: raw.techStack
      .map(toPublicTechStack)
      .filter((group): group is PublicTechStackGroup => Boolean(group)),
  };
}

function serializePublicProfile(value: unknown, siteUrl: URL) {
  return toPublicProfile(rawProfileSchema.parse(value), siteUrl);
}

function serializePublicExperience(value: unknown, siteUrl: URL) {
  const raw = rawExperienceSchema.nullable().parse(value);
  return raw ? toPublicExperience(raw, siteUrl) : null;
}

function serializePublicExperienceList(value: unknown, siteUrl: URL) {
  return z
    .array(rawExperienceSchema)
    .parse(value)
    .map((item) => toPublicExperience(item, siteUrl))
    .filter((item): item is PublicExperience => Boolean(item));
}

function serializePublicProject(value: unknown, siteUrl: URL) {
  const raw = rawProjectSchema.nullable().parse(value);
  return raw ? toPublicProject(raw, siteUrl) : null;
}

function serializePublicProjectList(value: unknown, siteUrl: URL) {
  return z
    .array(rawProjectSchema)
    .parse(value)
    .map((item) => toPublicProject(item, siteUrl))
    .filter((item): item is PublicProject => Boolean(item));
}

function serializePublicBlogPostList(value: unknown, siteUrl: URL) {
  return z
    .array(rawBlogSummarySchema)
    .parse(value)
    .map((item) => toPublicBlogSummary(item, siteUrl))
    .filter((item): item is PublicBlogPostSummary => Boolean(item));
}

function serializePublicTechStack(value: unknown) {
  return z
    .array(rawTechStackSchema)
    .parse(value)
    .map(toPublicTechStack)
    .filter((group): group is PublicTechStackGroup => Boolean(group));
}

export function createPublicPortfolioService(
  dependencies: ServiceDependencies,
): PublicPortfolioService {
  async function getSnapshot() {
    if (
      dependencies.fetchBlogPosts &&
      dependencies.fetchExperienceList &&
      dependencies.fetchProfile &&
      dependencies.fetchProjectList &&
      dependencies.fetchTechStack
    ) {
      const [blogs, experience, profile, projects, techStack] = await Promise.all([
        dependencies
          .fetchBlogPosts()
          .then((value) => serializePublicBlogPostList(value, dependencies.siteUrl)),
        dependencies
          .fetchExperienceList()
          .then((value) => serializePublicExperienceList(value, dependencies.siteUrl)),
        dependencies
          .fetchProfile()
          .then((value) => serializePublicProfile(value, dependencies.siteUrl)),
        dependencies
          .fetchProjectList()
          .then((value) => serializePublicProjectList(value, dependencies.siteUrl)),
        dependencies.fetchTechStack().then(serializePublicTechStack),
      ]);

      return { blogs, experience, profile, projects, techStack };
    }

    if (!dependencies.fetchSnapshot) {
      throw new Error("Public portfolio service requires domain fetchers or a snapshot fetcher.");
    }
    return serializePublicSnapshot(await dependencies.fetchSnapshot(), dependencies.siteUrl);
  }

  async function getResumeSource() {
    if (
      dependencies.fetchExperienceList &&
      dependencies.fetchProfile &&
      dependencies.fetchTechStack
    ) {
      const [experience, profile, techStack] = await Promise.all([
        dependencies
          .fetchExperienceList()
          .then((value) => serializePublicExperienceList(value, dependencies.siteUrl)),
        dependencies
          .fetchProfile()
          .then((value) => serializePublicProfile(value, dependencies.siteUrl)),
        dependencies.fetchTechStack().then(serializePublicTechStack),
      ]);
      return { experience, profile, techStack };
    }

    const snapshot = await getSnapshot();
    return {
      experience: snapshot.experience,
      profile: snapshot.profile,
      techStack: snapshot.techStack,
    };
  }

  return {
    async getBlogPost(slug) {
      const raw = rawBlogPostSchema.nullable().parse(await dependencies.fetchBlogPost(slug));
      return toPublicBlogPost(raw, dependencies.siteUrl);
    },
    async getExperience(slug) {
      if (dependencies.fetchExperience) {
        return serializePublicExperience(
          await dependencies.fetchExperience(slug),
          dependencies.siteUrl,
        );
      }
      return (
        (await getSnapshot()).experience.find((experience) => experience.slug === slug) ?? null
      );
    },
    async getProfile() {
      if (dependencies.fetchProfile) {
        return serializePublicProfile(await dependencies.fetchProfile(), dependencies.siteUrl);
      }
      return (await getSnapshot()).profile;
    },
    async getProject(slug) {
      if (dependencies.fetchProject) {
        return serializePublicProject(await dependencies.fetchProject(slug), dependencies.siteUrl);
      }
      return (await getSnapshot()).projects.find((project) => project.slug === slug) ?? null;
    },
    async getResume() {
      const source = await getResumeSource();
      if (!source.profile) return null;

      return publicResumeSchema.parse({
        name: source.profile.name,
        role: source.profile.role,
        pdfUrl: source.profile.resumePdfUrl,
        summary: [source.profile.biography, source.profile.about].filter(Boolean).join("\n\n"),
        contact: {
          email: source.profile.email,
          github: source.profile.links.github,
          linkedin: source.profile.links.linkedin,
          website: source.profile.url,
        },
        experience: source.experience,
        techStack: source.techStack,
      });
    },
    getSnapshot,
    async listBlogPosts({ limit = 10, offset = 0, query = "" } = {}) {
      const blogs = dependencies.fetchBlogPosts
        ? serializePublicBlogPostList(await dependencies.fetchBlogPosts(), dependencies.siteUrl)
        : (await getSnapshot()).blogs;
      const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
      const matches = normalizedQuery
        ? blogs.filter((blog) => blog.title.toLocaleLowerCase("en-US").includes(normalizedQuery))
        : blogs;

      return publicBlogPostListSchema.parse({
        items: matches.slice(offset, offset + limit),
        limit,
        offset,
        total: matches.length,
      });
    },
    async listExperience() {
      const items = dependencies.fetchExperienceList
        ? serializePublicExperienceList(
            await dependencies.fetchExperienceList(),
            dependencies.siteUrl,
          )
        : (await getSnapshot()).experience;
      return publicExperienceListSchema.parse({ items, total: items.length });
    },
    async listProjects() {
      const items = dependencies.fetchProjectList
        ? serializePublicProjectList(await dependencies.fetchProjectList(), dependencies.siteUrl)
        : (await getSnapshot()).projects;
      return publicProjectListSchema.parse({ items, total: items.length });
    },
    async listTechStack() {
      const groups = dependencies.fetchTechStack
        ? serializePublicTechStack(await dependencies.fetchTechStack())
        : (await getSnapshot()).techStack;
      return publicTechStackSchema.parse({ groups, total: groups.length });
    },
  };
}

let service: PublicPortfolioService | undefined;

export function getPublicPortfolioService() {
  service ??= createPublicPortfolioService({
    fetchBlogPost,
    fetchBlogPosts,
    fetchExperience,
    fetchExperienceList,
    fetchProfile,
    fetchProject,
    fetchProjectList,
    fetchTechStack,
    siteUrl: new URL(getSiteEnv().siteUrl),
  });
  return service;
}

export const getPublicPortfolioSnapshot = () => getPublicPortfolioService().getSnapshot();
export const getPublicProfile = () => getPublicPortfolioService().getProfile();
export const getPublicExperience = (slug: string) =>
  getPublicPortfolioService().getExperience(slug);
export const getPublicProject = (slug: string) => getPublicPortfolioService().getProject(slug);
export const getPublicResume = () => getPublicPortfolioService().getResume();
export const listPublicExperience = () => getPublicPortfolioService().listExperience();
export const listPublicProjects = () => getPublicPortfolioService().listProjects();
export const listPublicBlogPosts = (options?: PublicBlogPostListOptions) =>
  getPublicPortfolioService().listBlogPosts(options);
export const getPublicBlogPost = (slug: string) => getPublicPortfolioService().getBlogPost(slug);
export const getPublicTechStack = () => getPublicPortfolioService().listTechStack();
