import "server-only";
import type { PublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import type { SearchItem } from "@/features/search/types/search";
import type { Locale } from "@/i18n/routing";

type Label = { description: string; title: string };

export type SearchIndexCopy = {
  actions: {
    book: Label;
    languages: Record<Locale, Label>;
    theme: Label;
  };
  pages: Record<
    "assistant" | "blogs" | "contact" | "developers" | "github" | "home" | "projects",
    Label
  >;
  profile: {
    email: Label;
    github: Label;
    linkedin: Label;
    resume: Label;
  };
};

type SearchIndexTranslations = {
  experience: Record<string, { period: string; role: string }>;
  projects: Record<string, string>;
};

const pageDefinitions = [
  { key: "home", href: "/", aliases: ["about", "portfolio", "profile", "skills"] },
  { key: "projects", href: "/projects", aliases: ["work", "apps", "case studies"] },
  { key: "blogs", href: "/blogs", aliases: ["blog", "articles", "writing", "posts"] },
  {
    key: "github",
    href: "/github-contributions",
    aliases: ["commits", "repositories", "source", "activity"],
  },
  {
    key: "assistant",
    href: "/ask",
    aliases: ["ai", "chat", "ask zomer", "assistant", "questions"],
  },
  { key: "contact", href: "/contact", aliases: ["email", "talk", "hire", "reach"] },
  {
    key: "developers",
    href: "/developers",
    aliases: ["api", "openapi", "mcp", "documentation", "rest", "integration"],
  },
] as const;

const machinePages: SearchItem[] = [
  {
    aliases: ["site map", "xml routes"],
    description: "Machine-readable list of public portfolio routes.",
    group: "page",
    href: "/sitemap.xml",
    id: "page:sitemap",
    keywords: ["seo", "discovery", "routes", "xml"],
    machineRoute: true,
    title: "Sitemap",
  },
  {
    aliases: ["llms", "ai summary"],
    description: "Concise portfolio guidance for language models.",
    group: "page",
    href: "/llms.txt",
    id: "page:llms",
    keywords: ["ai", "agents", "machine readable", "text"],
    machineRoute: true,
    title: "llms.txt",
  },
  {
    aliases: ["full llms", "ai portfolio"],
    description: "Expanded machine-readable portfolio content.",
    group: "page",
    href: "/llms-full.txt",
    id: "page:llms-full",
    keywords: ["ai", "agents", "experience", "projects", "text"],
    machineRoute: true,
    title: "llms-full.txt",
  },
  {
    aliases: ["developer markdown", "api markdown"],
    description: "Developer documentation in Markdown.",
    group: "page",
    href: "/developers.md",
    id: "page:developers-markdown",
    keywords: ["api", "mcp", "docs", "markdown"],
    machineRoute: true,
    title: "developers.md",
  },
  {
    aliases: ["mcp documentation", "llm developer guide"],
    description: "Machine-readable guidance for the developer interfaces.",
    group: "page",
    href: "/developers/llms.txt",
    id: "page:developers-llms",
    keywords: ["api", "mcp", "agents", "docs", "text"],
    machineRoute: true,
    title: "MCP developer guide",
  },
  {
    aliases: ["open api", "api schema"],
    description: "OpenAPI schema for the public portfolio API.",
    group: "page",
    href: "/openapi.json",
    id: "page:openapi",
    keywords: ["api", "rest", "schema", "json", "developers"],
    machineRoute: true,
    title: "OpenAPI",
  },
  {
    aliases: ["authentication", "api auth"],
    description: "Authentication guidance for public developer interfaces.",
    group: "page",
    href: "/auth.md",
    id: "page:auth",
    keywords: ["api", "mcp", "security", "markdown"],
    machineRoute: true,
    title: "Authentication",
  },
];

function detailKeywords(details: Array<{ content: Array<{ text: string }>; title: string }>) {
  return details.flatMap((section) => [section.title, ...section.content.map((item) => item.text)]);
}

export function buildSearchIndex(
  snapshot: PublicPortfolioSnapshot,
  copy: SearchIndexCopy,
  translations: SearchIndexTranslations,
): SearchItem[] {
  const { profile } = snapshot;
  const pages: SearchItem[] = pageDefinitions.map(({ aliases, href, key }) => ({
    aliases: [...aliases],
    description: copy.pages[key].description,
    group: "page",
    href,
    id: `page:${key}`,
    keywords: [
      href,
      copy.pages[key].title,
      ...(key === "home" ? snapshot.techStack.flatMap((group) => group.items) : []),
    ],
    title: copy.pages[key].title,
  }));
  const experience: SearchItem[] = snapshot.experience.map((item) => {
    const localized = translations.experience[item.company];
    const role = localized?.role ?? item.role;
    return {
      aliases: [item.company, item.slug, role, "work", "experience"],
      description: `${role} · ${localized?.period ?? item.period}`,
      group: "work",
      href: `/work/${item.slug}`,
      id: `work:${item.slug}`,
      keywords: [
        ...item.technologies,
        item.summary ?? "",
        ...item.responsibilities,
        ...detailKeywords(item.details),
      ],
      title: `${role} — ${item.company}`,
    };
  });
  const projects: SearchItem[] = snapshot.projects.map((item) => ({
    aliases: [item.title, item.slug, "project", "case study"],
    description: translations.projects[item.title] ?? item.description,
    group: "project",
    href: `/projects/${item.slug}`,
    id: `project:${item.slug}`,
    keywords: [...item.technologies, item.description, ...detailKeywords(item.details)],
    title: item.title,
  }));
  const blogs: SearchItem[] = snapshot.blogs.map((item) => ({
    aliases: [item.title, item.slug, "blog", "article", "post"],
    description: item.description,
    group: "blog",
    href: `/blogs/${item.slug}`,
    id: `blog:${item.slug}`,
    keywords: [...item.tags, item.description],
    title: item.title,
  }));
  const resources: SearchItem[] = profile
    ? [
        {
          aliases: ["cv", "curriculum vitae", "download resume"],
          description: copy.profile.resume.description,
          external: true,
          group: "profile",
          href: profile.resumePdfUrl,
          id: "profile:resume",
          keywords: ["career", "experience", "skills", "pdf"],
          title: copy.profile.resume.title,
        },
        {
          aliases: ["source", "repositories", "code"],
          description: copy.profile.github.description,
          external: true,
          group: "profile",
          href: profile.links.github,
          id: "profile:github",
          keywords: ["open source", "commits", "profile"],
          title: copy.profile.github.title,
        },
        {
          aliases: ["professional profile", "network"],
          description: copy.profile.linkedin.description,
          external: true,
          group: "profile",
          href: profile.links.linkedin,
          id: "profile:linkedin",
          keywords: ["career", "work", "profile"],
          title: copy.profile.linkedin.title,
        },
        {
          aliases: ["mail", "contact", "reach out"],
          description: copy.profile.email.description,
          group: "profile",
          href: profile.links.email,
          id: "profile:email",
          keywords: [profile.email, "message", "hire"],
          machineRoute: true,
          title: copy.profile.email.title,
        },
      ]
    : [];
  const actions: SearchItem[] = [
    {
      action: { kind: "toggle-theme" },
      aliases: ["dark mode", "light mode", "system theme", "appearance"],
      description: copy.actions.theme.description,
      group: "action",
      id: "action:theme",
      keywords: ["color", "display", "toggle"],
      title: copy.actions.theme.title,
    },
    {
      action: { kind: "book-call" },
      aliases: ["meeting", "schedule", "calendar", "appointment"],
      description: copy.actions.book.description,
      group: "action",
      id: "action:book",
      keywords: ["book", "call", "talk", "contact"],
      title: copy.actions.book.title,
    },
    ...Object.entries(copy.actions.languages).map(([locale, label]): SearchItem => ({
      action: { kind: "switch-locale", locale: locale as Locale },
      aliases: ["language", locale, label.title],
      description: label.description,
      group: "action",
      id: `action:locale:${locale}`,
      keywords: ["translate", "locale", "english", "japanese", "chinese", "german"],
      title: label.title,
    })),
  ];

  return [
    ...pages,
    ...machinePages,
    ...experience,
    ...projects,
    ...blogs,
    ...resources,
    ...actions,
  ];
}
