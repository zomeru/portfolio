import { z } from "zod";

const nullableUrl = z.url().nullable();
const publicSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const publicDetailContentSchema = z.object({
  style: z.enum(["bullet", "number", "paragraph"]),
  text: z.string().min(1),
});

export const publicDetailSectionSchema = z.object({
  content: z.array(publicDetailContentSchema).min(1),
  title: z.string().min(1),
});

export const publicPhotoSchema = z.object({
  alt: z.string(),
  height: z.number().int().positive().nullable(),
  lqip: z.string().nullable(),
  url: z.url(),
  width: z.number().int().positive().nullable(),
});

export const publicProfileSchema = z.object({
  about: z.string(),
  biography: z.string(),
  email: z.email(),
  links: z.object({
    email: z.string().startsWith("mailto:"),
    github: z.url(),
    linkedin: z.url(),
    resume: z.url(),
    website: z.url(),
  }),
  name: z.string().min(1),
  photo: publicPhotoSchema.nullable(),
  resumePdfUrl: z.url(),
  role: z.string().min(1),
  url: z.url(),
});

export const publicExperienceSchema = z.object({
  canonicalUrl: z.url(),
  company: z.string().min(1),
  companyUrl: nullableUrl,
  details: z.array(publicDetailSectionSchema),
  location: z.string().nullable(),
  period: z.string().min(1),
  responsibilities: z.array(z.string().min(1)),
  role: z.string().min(1),
  slug: publicSlugSchema,
  summary: z.string().nullable(),
  technologies: z.array(z.string().min(1)),
  updatedAt: z.iso.datetime(),
});

export const publicProjectSchema = z.object({
  canonicalUrl: z.url(),
  caseStudyUrl: nullableUrl,
  demoUrl: nullableUrl,
  description: z.string().min(1),
  details: z.array(publicDetailSectionSchema),
  image: publicPhotoSchema.nullable(),
  repositoryUrl: nullableUrl,
  slug: publicSlugSchema,
  technologies: z.array(z.string().min(1)),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
  year: z.string().regex(/^\d{4}$/),
});

export const publicBlogPostSummarySchema = z.object({
  canonicalUrl: z.url(),
  date: z.iso.datetime(),
  description: z.string(),
  slug: z.string().min(1),
  tags: z.array(z.string().min(1)),
  title: z.string().min(1),
});

export const publicBlogPostSchema = publicBlogPostSummarySchema.extend({
  body: z.string().min(1),
  readTimeMinutes: z.number().int().positive().nullable(),
  updatedAt: z.iso.datetime().nullable(),
});

export const publicTechStackGroupSchema = z.object({
  items: z.array(z.string().min(1)),
  name: z.string().min(1),
});

export const publicResumeSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  pdfUrl: z.url(),
  summary: z.string(),
  contact: z.object({
    email: z.email(),
    github: z.url(),
    linkedin: z.url(),
    website: z.url(),
  }),
  experience: z.array(publicExperienceSchema),
  techStack: z.array(publicTechStackGroupSchema),
});

export const publicExperienceListSchema = z.object({
  items: z.array(publicExperienceSchema),
  total: z.number().int().nonnegative(),
});

export const publicProjectListSchema = z.object({
  items: z.array(publicProjectSchema),
  total: z.number().int().nonnegative(),
});

export const publicBlogPostListSchema = z.object({
  items: z.array(publicBlogPostSummarySchema),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const publicTechStackSchema = z.object({
  groups: z.array(publicTechStackGroupSchema),
  total: z.number().int().nonnegative(),
});

export const publicErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    resolution: z.string().min(1),
  }),
  requestId: z.string().optional(),
});

export const publicApiIndexSchema = z.object({
  authentication: z.literal("none"),
  capabilities: z.array(z.string()),
  discovery: z.object({
    agentSkills: z.url(),
    apiCatalog: z.url(),
    docsMcpServerCard: z.url(),
    llms: z.url(),
    mcpServerCard: z.url(),
  }),
  documentation: z.url(),
  mcp: z.object({
    documentation: z.url(),
    portfolio: z.url(),
  }),
  name: z.string(),
  openapi: z.url(),
  resources: z.object({
    blogs: z.url(),
    experience: z.url(),
    profile: z.url(),
    projects: z.url(),
    resume: z.url(),
    techStack: z.url(),
  }),
  version: z.string(),
});

export type PublicPhoto = z.infer<typeof publicPhotoSchema>;
export type PublicDetailContent = z.infer<typeof publicDetailContentSchema>;
export type PublicDetailSection = z.infer<typeof publicDetailSectionSchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type PublicExperience = z.infer<typeof publicExperienceSchema>;
export type PublicProject = z.infer<typeof publicProjectSchema>;
export type PublicBlogPostSummary = z.infer<typeof publicBlogPostSummarySchema>;
export type PublicBlogPost = z.infer<typeof publicBlogPostSchema>;
export type PublicTechStackGroup = z.infer<typeof publicTechStackGroupSchema>;
export type PublicResume = z.infer<typeof publicResumeSchema>;
export type PublicExperienceList = z.infer<typeof publicExperienceListSchema>;
export type PublicProjectList = z.infer<typeof publicProjectListSchema>;
export type PublicBlogPostList = z.infer<typeof publicBlogPostListSchema>;
export type PublicTechStack = z.infer<typeof publicTechStackSchema>;
export type PublicApiIndex = z.infer<typeof publicApiIndexSchema>;
