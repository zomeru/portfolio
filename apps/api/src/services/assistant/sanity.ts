import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";
import { createClient, type SanityClient } from "@sanity/client";

const SANITY_API_VERSION = "2026-08-20";

const KNOWLEDGE_FILTER = `_type in ["profile", "experience", "project", "blogPost", "techStack"] && !(_id in path("drafts.**"))`;

const KNOWLEDGE_PROJECTION = /* groq */ `{
    _id,
    _type,
    _updatedAt,
    name,
    role,
    email,
    githubUrl,
    linkedinUrl,
    biography,
    aboutContent,
    company,
    location,
    period,
    summary,
    responsibilities,
    technologies,
    companyUrl,
    title,
    year,
    description,
    demoUrl,
    repositoryUrl,
    caseStudyUrl,
    image { alt },
    items,
    "slug": slug.current,
    excerpt,
    body,
    publishedAt,
    updatedAt,
    tags
  }`;

const KNOWLEDGE_QUERY = /* groq */ `
  *[${KNOWLEDGE_FILTER}] ${KNOWLEDGE_PROJECTION}
`;

const KNOWLEDGE_BY_ID_QUERY = /* groq */ `
  *[${KNOWLEDGE_FILTER} && _id == $documentId][0] ${KNOWLEDGE_PROJECTION}
`;

export type SanityKnowledgeSource = {
  _id: string;
  _type: "profile" | "experience" | "project" | "blogPost" | "techStack";
  _updatedAt: string;
  [key: string]: unknown;
};

let readClient: SanityClient | undefined;

function getReadClient() {
  if (readClient) return readClient;

  const sanity = getSanityEnv();
  const server = getSanityServerEnv();
  readClient = createClient({
    apiVersion: SANITY_API_VERSION,
    dataset: sanity.dataset,
    perspective: "published",
    projectId: sanity.projectId,
    token: server.token,
    useCdn: false,
  });

  return readClient;
}

export function fetchSanityKnowledgeSources() {
  return getReadClient().fetch<SanityKnowledgeSource[]>(KNOWLEDGE_QUERY);
}

export function fetchSanityKnowledgeSource(documentId: string) {
  return getReadClient().fetch<SanityKnowledgeSource | null>(KNOWLEDGE_BY_ID_QUERY, {
    documentId,
  });
}
