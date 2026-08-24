import type { SanityKnowledgeSource } from "./sanity";
import type { NormalizedKnowledgeDocument, NormalizedSection } from "./types";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.map(stringValue).filter((item): item is string => Boolean(item))
    : [];
}

const MONTH_NUMBERS = new Map<string, string>([
  ["jan", "01"],
  ["feb", "02"],
  ["mar", "03"],
  ["apr", "04"],
  ["may", "05"],
  ["jun", "06"],
  ["jul", "07"],
  ["aug", "08"],
  ["sep", "09"],
  ["oct", "10"],
  ["nov", "11"],
  ["dec", "12"],
] as const);

function parseMonthYear(value: string) {
  const match = /([a-z]+)\.?\s+(\d{4})/i.exec(value);
  const monthName = match?.[1]?.slice(0, 3).toLocaleLowerCase();
  const month = monthName ? MONTH_NUMBERS.get(monthName) : undefined;
  const year = match?.[2];
  return month && year ? `${year}-${month}-01` : undefined;
}

function experiencePeriodMetadata(period: string) {
  const [start = "", end = ""] = period.split(/\s+(?:—|–|-)\s+/u, 2);
  const isCurrent = /\b(?:current|now|present)\b/i.test(end);
  return {
    ...(parseMonthYear(start) ? { periodStart: parseMonthYear(start) } : {}),
    ...(isCurrent
      ? { periodEnd: "9999-12-31" }
      : parseMonthYear(end)
        ? { periodEnd: parseMonthYear(end) }
        : {}),
    isCurrent,
  };
}

function portableTextToText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(portableTextToText).filter(Boolean).join("\n\n");
  }
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (Array.isArray(record.children)) {
    return record.children.map(portableTextToText).filter(Boolean).join("");
  }

  return "";
}

function markdownSections(markdown: string): NormalizedSection[] {
  const cleaned = markdown
    .replace(/!\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .trim();
  if (!cleaned) return [];

  const sections: NormalizedSection[] = [];
  let heading = "Article overview";
  let headingPath = [heading];
  const headingStack: string[] = [];
  let inCodeFence = false;
  let lines: string[] = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) sections.push({ heading, headingPath: [...headingPath], text });
    lines = [];
  };

  for (const line of cleaned.split("\n")) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      lines.push(line);
      continue;
    }

    const match = inCodeFence ? null : /^(#{1,4})\s+(.+)$/.exec(line);
    if (match?.[2]) {
      flush();
      const level = match[1]?.length ?? 1;
      heading = match[2].replace(/[*_`]/g, "").trim();
      headingStack.length = level - 1;
      headingStack[level - 1] = heading;
      headingPath = headingStack.filter(Boolean);
      continue;
    }
    lines.push(line);
  }
  flush();

  return sections;
}

function baseDocument(source: SanityKnowledgeSource) {
  return {
    sanityDocumentId: source._id,
    sanityUpdatedAt: new Date(source._updatedAt),
  };
}

function normalizeProfile(source: SanityKnowledgeSource): NormalizedKnowledgeDocument | null {
  const name = stringValue(source.name);
  if (!name) return null;
  const role = stringValue(source.role);
  const biography = portableTextToText(source.biography);
  const about = portableTextToText(source.aboutContent);
  const contact = [
    stringValue(source.email) && `Email: ${stringValue(source.email)}`,
    stringValue(source.githubUrl) && `GitHub: ${stringValue(source.githubUrl)}`,
    stringValue(source.linkedinUrl) && `LinkedIn: ${stringValue(source.linkedinUrl)}`,
  ].filter(Boolean);

  return {
    ...baseDocument(source),
    sourceType: "profile",
    slug: null,
    title: name,
    canonicalUrl: "/",
    metadata: { name, role },
    sections: [
      {
        heading: "Profile",
        text: [`Name: ${name}`, role && `Role: ${role}`].filter(Boolean).join("\n"),
      },
      biography && { heading: "Biography", text: biography },
      about && { heading: "About", text: about },
      contact.length > 0 && { heading: "Contact and links", text: contact.join("\n") },
    ].filter((section): section is NormalizedSection => Boolean(section)),
  };
}

function normalizeExperience(source: SanityKnowledgeSource): NormalizedKnowledgeDocument | null {
  const role = stringValue(source.role);
  const company = stringValue(source.company);
  if (!role || !company) return null;
  const technologies = stringList(source.technologies);
  const summary = stringValue(source.summary);
  const responsibilities = portableTextToText(source.responsibilities);
  const period = stringValue(source.period);
  const location = stringValue(source.location);
  const companyUrl = stringValue(source.companyUrl);
  const periodMetadata = experiencePeriodMetadata(period);

  return {
    ...baseDocument(source),
    sourceType: "experience",
    slug: null,
    title: `${role} at ${company}`,
    canonicalUrl: "/",
    metadata: {
      company,
      role,
      period,
      ...periodMetadata,
      location,
      technologies,
      companyUrl,
    },
    sections: [
      {
        heading: "Work experience",
        text: [
          `Company: ${company}`,
          `Role: ${role}`,
          period && `Dates: ${period}`,
          location && `Location: ${location}`,
          technologies.length > 0 && `Technologies: ${technologies.join(", ")}`,
          companyUrl && `Company website: ${companyUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      summary && { heading: "Summary", text: summary },
      responsibilities && { heading: "Responsibilities and achievements", text: responsibilities },
    ].filter((section): section is NormalizedSection => Boolean(section)),
  };
}

function normalizeProject(source: SanityKnowledgeSource): NormalizedKnowledgeDocument | null {
  const title = stringValue(source.title);
  const description = stringValue(source.description);
  if (!title || !description) return null;
  const technologies = stringList(source.technologies);
  const image = source.image && typeof source.image === "object" ? source.image : null;
  const imageAlt = image && "alt" in image ? stringValue(image.alt) : "";
  const links = [
    stringValue(source.demoUrl) && `Demo: ${stringValue(source.demoUrl)}`,
    stringValue(source.repositoryUrl) && `Repository: ${stringValue(source.repositoryUrl)}`,
    stringValue(source.caseStudyUrl) && `Case study: ${stringValue(source.caseStudyUrl)}`,
  ].filter(Boolean);

  return {
    ...baseDocument(source),
    sourceType: "project",
    slug: null,
    title,
    canonicalUrl: "/projects",
    metadata: {
      title,
      year: stringValue(source.year),
      technologies,
      imageAlt,
    },
    sections: [
      {
        heading: "Project",
        text: [
          `Title: ${title}`,
          stringValue(source.year) && `Year: ${stringValue(source.year)}`,
          technologies.length > 0 && `Technologies: ${technologies.join(", ")}`,
          `Description: ${description}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      imageAlt && { heading: "Project image description", text: imageAlt },
      links.length > 0 && { heading: "Project links", text: links.join("\n") },
    ].filter((section): section is NormalizedSection => Boolean(section)),
  };
}

function normalizeTechStack(source: SanityKnowledgeSource): NormalizedKnowledgeDocument | null {
  const name = stringValue(source.name);
  const technologies = stringList(source.items);
  if (!name || technologies.length === 0) return null;

  return {
    ...baseDocument(source),
    sourceType: "techstack",
    slug: null,
    title: `${name} tech stack`,
    canonicalUrl: "/",
    metadata: {
      name,
      technologies,
    },
    sections: [
      {
        heading: "Tech stack",
        text: `Category: ${name}\nTechnologies: ${technologies.join(", ")}`,
      },
    ],
  };
}

function normalizeBlog(source: SanityKnowledgeSource): NormalizedKnowledgeDocument | null {
  const title = stringValue(source.title);
  const slug = stringValue(source.slug);
  const body = stringValue(source.body);
  if (!title || !slug || !body) return null;
  const tags = stringList(source.tags);

  return {
    ...baseDocument(source),
    sourceType: "blog",
    slug,
    title,
    canonicalUrl: `/blogs/${slug}`,
    metadata: {
      title,
      slug,
      publishedAt: stringValue(source.publishedAt),
      updatedAt: stringValue(source.updatedAt),
      tags,
    },
    sections: [
      {
        heading: "Article metadata",
        text: [
          `Title: ${title}`,
          stringValue(source.excerpt) && `Description: ${stringValue(source.excerpt)}`,
          stringValue(source.publishedAt) && `Published: ${stringValue(source.publishedAt)}`,
          tags.length > 0 && `Tags: ${tags.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      ...markdownSections(body),
    ],
  };
}

export function normalizeSanityKnowledge(
  sources: readonly SanityKnowledgeSource[],
): NormalizedKnowledgeDocument[] {
  return sources
    .map((source) => {
      if (source._type === "profile") return normalizeProfile(source);
      if (source._type === "experience") return normalizeExperience(source);
      if (source._type === "project") return normalizeProject(source);
      if (source._type === "techStack") return normalizeTechStack(source);
      return normalizeBlog(source);
    })
    .filter((document): document is NormalizedKnowledgeDocument => Boolean(document));
}
