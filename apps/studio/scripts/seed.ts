import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";

import { getCliClient } from "sanity/cli";

type SeedDocument = Record<string, unknown> & { _type: string };

type ExistingExperience = { company: string | null; period: string | null; role: string | null };
type ExistingBlogPost = { _id: string; body: unknown; slug: string | null };
type ExistingProject = { title: string | null };
type ExistingTechStack = { name: string | null };

const API_VERSION = "2026-08-20";
const BATCH_SIZE = 25;
const DRY_RUN = process.argv.includes("--dry-run");
const dataDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../data");

function log(message: string) {
  console.log(`[studio:seed] ${message}`);
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

function getString(document: SeedDocument, field: string) {
  const value = document[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Expected ${document._type}.${field} to be a non-empty string.`);
  }

  return value;
}

function getSlug(document: SeedDocument) {
  const slug = document.slug;
  if (
    !slug ||
    typeof slug !== "object" ||
    !("current" in slug) ||
    typeof slug.current !== "string" ||
    !slug.current.trim()
  ) {
    throw new Error("Expected blogPost.slug.current to be a non-empty string.");
  }

  return slug.current;
}

function withoutSystemFields(document: SeedDocument): SeedDocument {
  const { _createdAt, _id, _rev, _system, _updatedAt, ...content } = document;
  return content;
}

async function readSeedArray(filename: string) {
  const value: unknown = JSON.parse(await readFile(resolve(dataDirectory, filename), "utf8"));
  if (
    !Array.isArray(value) ||
    !value.every((document) => document && typeof document === "object")
  ) {
    throw new Error(`${filename} must contain a JSON array of documents.`);
  }

  return value as SeedDocument[];
}

function assertNoDuplicateKeys(
  documents: SeedDocument[],
  label: string,
  getKey: (document: SeedDocument) => string,
) {
  const keys = new Set<string>();

  for (const document of documents) {
    const key = getKey(document);
    if (!key) throw new Error(`${label} has an empty duplicate-prevention key.`);
    if (keys.has(key)) throw new Error(`${label} contains duplicate seed data for “${key}”.`);
    keys.add(key);
  }
}

async function createInBatches(
  client: ReturnType<typeof getCliClient>,
  label: string,
  documents: SeedDocument[],
) {
  if (documents.length === 0) {
    log(`${label}: no missing documents; skipped.`);
    return;
  }

  const batchCount = Math.ceil(documents.length / BATCH_SIZE);
  log(`${label}: creating ${documents.length} document(s) in ${batchCount} batch(es).`);

  for (let index = 0; index < documents.length; index += BATCH_SIZE) {
    const batch = documents.slice(index, index + BATCH_SIZE);
    const batchNumber = index / BATCH_SIZE + 1;
    log(`${label}: committing batch ${batchNumber}/${batchCount} (${batch.length} document(s)).`);

    let transaction = client.transaction();
    for (const document of batch) transaction = transaction.create(document);
    await transaction.commit();
  }

  log(`${label}: complete.`);
}

async function synchronizeBlogBodies(
  client: ReturnType<typeof getCliClient>,
  documents: Array<{ _id: string; body: string }>,
) {
  if (documents.length === 0) {
    log("Blog post body synchronization: all matching posts are current; skipped.");
    return;
  }

  const batchCount = Math.ceil(documents.length / BATCH_SIZE);
  log(
    `Blog post body synchronization: updating ${documents.length} document(s) in ${batchCount} batch(es).`,
  );

  for (let index = 0; index < documents.length; index += BATCH_SIZE) {
    const batch = documents.slice(index, index + BATCH_SIZE);
    const batchNumber = index / BATCH_SIZE + 1;
    log(
      `Blog post body synchronization: committing batch ${batchNumber}/${batchCount} (${batch.length} document(s)).`,
    );

    let transaction = client.transaction();
    for (const document of batch) {
      transaction = transaction.patch(document._id, { set: { body: document.body } });
    }
    await transaction.commit();
  }

  log("Blog post body synchronization: complete.");
}

async function validateWriteAccess(
  client: ReturnType<typeof getCliClient>,
  profileDocument: SeedDocument,
  profileExists: boolean,
  missingDocuments: SeedDocument[],
  blogBodyUpdates: Array<{ _id: string; body: string }>,
) {
  log("Dry run: validating write permission without changing the dataset.");

  if (!profileExists) {
    await client.create(profileDocument, { dryRun: true });
  } else if (missingDocuments[0]) {
    await client.create(missingDocuments[0], { dryRun: true });
  } else if (blogBodyUpdates[0]) {
    await client
      .patch(blogBodyUpdates[0]._id)
      .set({ body: blogBodyUpdates[0].body })
      .commit({ dryRun: true });
  } else {
    log("Dry run: no writes are planned, so no write-permission probe is needed.");
    return;
  }

  log("Dry run: write permission confirmed.");
}

async function main() {
  const token = getSanityServerEnv().token;

  const client = getCliClient({
    apiVersion: API_VERSION,
    perspective: "raw",
  }).withConfig({
    token,
  });
  const { dataset } = client.config();
  if (dataset !== "development") {
    throw new Error(`Refusing to seed dataset “${dataset}”. This script only seeds development.`);
  }

  log(`Starting ${DRY_RUN ? "dry run" : "seed"} for the development dataset.`);
  log("Loading profile, experience, blog, project, and tech stack seed files.");
  const [profiles, experiences, blogPosts, projects, techStacks] = await Promise.all([
    readSeedArray("profile.json"),
    readSeedArray("experience.json"),
    readSeedArray("blog.json"),
    readSeedArray("projects.json"),
    readSeedArray("techstack.json"),
  ]);
  log(
    `Loaded ${profiles.length} profile, ${experiences.length} experience, ${blogPosts.length} blog, ${projects.length} project, and ${techStacks.length} tech stack document(s).`,
  );

  if (profiles.length !== 1 || profiles[0]?._type !== "profile") {
    throw new Error("profile.json must contain exactly one profile document.");
  }

  for (const document of experiences) {
    if (document._type !== "experience")
      throw new Error("experience.json contains a non-experience document.");
  }
  for (const document of blogPosts) {
    if (document._type !== "blogPost")
      throw new Error("blog.json contains a non-blogPost document.");
    getString(document, "body");
  }
  for (const document of projects) {
    if (document._type !== "project")
      throw new Error("projects.json contains a non-project document.");
  }
  for (const document of techStacks) {
    if (document._type !== "techStack")
      throw new Error("techstack.json contains a non-techStack document.");
  }

  const experienceKey = (document: SeedDocument) =>
    ["company", "role", "period"]
      .map((field) => normalize(getString(document, field)))
      .join("\u0000");
  const blogPostKey = (document: SeedDocument) => normalize(getSlug(document));
  const projectKey = (document: SeedDocument) => normalize(getString(document, "title"));
  const techStackKey = (document: SeedDocument) => normalize(getString(document, "name"));

  assertNoDuplicateKeys(experiences, "experience.json", experienceKey);
  assertNoDuplicateKeys(blogPosts, "blog.json", blogPostKey);
  assertNoDuplicateKeys(projects, "projects.json", projectKey);
  assertNoDuplicateKeys(techStacks, "techstack.json", techStackKey);
  log("Validated seed document types and duplicate-prevention identities.");

  log("Checking the development dataset for existing published and draft documents.");
  const [
    profileExists,
    existingExperiences,
    existingBlogPosts,
    existingProjects,
    existingTechStacks,
  ] = await Promise.all([
    client.fetch<boolean>(`count(*[_id in ["profile", "drafts.profile"]]) > 0`),
    client.fetch<ExistingExperience[]>(`*[_type == "experience"]{company, role, period}`),
    client.fetch<ExistingBlogPost[]>(`*[_type == "blogPost"]{_id, body, "slug": slug.current}`),
    client.fetch<ExistingProject[]>(`*[_type == "project"]{title}`),
    client.fetch<ExistingTechStack[]>(`*[_type == "techStack"]{name}`),
  ]);

  const existingExperienceKeys = new Set(
    existingExperiences.map(({ company, role, period }) =>
      [company, role, period].map(normalize).join("\u0000"),
    ),
  );
  const existingBlogPostKeys = new Set(existingBlogPosts.map(({ slug }) => normalize(slug)));
  const existingProjectKeys = new Set(existingProjects.map(({ title }) => normalize(title)));
  const existingTechStackKeys = new Set(existingTechStacks.map(({ name }) => normalize(name)));

  const missingExperiences = experiences
    .map(withoutSystemFields)
    .filter((document) => !existingExperienceKeys.has(experienceKey(document)));
  const missingBlogPosts = blogPosts
    .map(withoutSystemFields)
    .filter((document) => !existingBlogPostKeys.has(blogPostKey(document)));
  const blogPostsByKey = new Map(
    blogPosts.map((document) => [blogPostKey(document), withoutSystemFields(document)]),
  );
  const blogBodyUpdates = existingBlogPosts.flatMap((document) => {
    const seedDocument = blogPostsByKey.get(normalize(document.slug));
    if (!seedDocument) return [];

    const body = getString(seedDocument, "body");
    if (document.body === body) return [];

    return [{ _id: document._id, body }];
  });
  const missingProjects = projects
    .map(withoutSystemFields)
    .filter((document) => !existingProjectKeys.has(projectKey(document)));
  const missingTechStacks = techStacks
    .map(withoutSystemFields)
    .filter((document) => !existingTechStackKeys.has(techStackKey(document)));

  const profile = withoutSystemFields(profiles[0]);
  const profileDocument = { ...profile, _id: "profile" };
  const missingDocuments = [
    ...missingExperiences,
    ...missingBlogPosts,
    ...missingProjects,
    ...missingTechStacks,
  ];
  const summary = {
    mode: DRY_RUN ? "dry-run" : "seeded",
    profile: profileExists ? "skipped" : "created",
    experiences: {
      created: missingExperiences.length,
      skipped: experiences.length - missingExperiences.length,
    },
    blogPosts: {
      created: missingBlogPosts.length,
      skipped: blogPosts.length - missingBlogPosts.length,
      synchronized: blogBodyUpdates.length,
    },
    projects: {
      created: missingProjects.length,
      skipped: projects.length - missingProjects.length,
    },
    techStacks: {
      created: missingTechStacks.length,
      skipped: techStacks.length - missingTechStacks.length,
    },
  };

  log(
    `Plan: profile ${summary.profile}; ${missingExperiences.length}/${experiences.length} experiences, ${missingBlogPosts.length}/${blogPosts.length} blog posts, ${missingProjects.length}/${projects.length} projects, and ${missingTechStacks.length}/${techStacks.length} tech stack groups will be created. ${blogBodyUpdates.length} existing blog body document(s) will be synchronized from blog.json.`,
  );

  if (DRY_RUN) {
    await validateWriteAccess(
      client,
      profileDocument,
      profileExists,
      missingDocuments,
      blogBodyUpdates,
    );
    log("Dry run complete. No documents were written.");
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (profileExists) log("Profile: existing singleton found; skipped.");
  else {
    log("Profile: creating singleton document.");
    await client.createIfNotExists(profileDocument);
    log("Profile: complete.");
  }
  await createInBatches(client, "Experiences", missingExperiences);
  await createInBatches(client, "Blog posts", missingBlogPosts);
  await synchronizeBlogBodies(client, blogBodyUpdates);
  await createInBatches(client, "Projects", missingProjects);
  await createInBatches(client, "Tech stack groups", missingTechStacks);

  log(`Seed complete. ${missingDocuments.length} document(s) created.`);
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
