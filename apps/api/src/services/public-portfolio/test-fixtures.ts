import type { PublicPortfolioService } from "./service";

export const testSiteUrl = new URL("https://portfolio.example/");

export const rawPublicSnapshotFixture = {
  blogs: [
    {
      date: "2026-08-01T00:00:00.000Z",
      description: "A published article.",
      internalScore: 0.99,
      slug: "published-article",
      tags: ["Next.js"],
      title: "Published Article",
    },
  ],
  experience: [
    {
      company: "Example Co",
      companyUrl: "https://example.com",
      details: [
        {
          _key: "detail-heading",
          _type: "block",
          children: [
            { _key: "detail-heading-text", _type: "span", marks: [], text: "Technical work" },
          ],
          markDefs: [],
          style: "h2",
        },
        {
          _key: "detail-body",
          _type: "block",
          children: [
            { _key: "detail-body-text", _type: "span", marks: [], text: "Improved the API." },
          ],
          level: 1,
          listItem: "bullet",
          markDefs: [],
          style: "normal",
        },
      ],
      location: "Remote",
      period: "2024–Present",
      privateNote: "must not leak",
      responsibilities: [
        {
          _key: "a",
          _type: "block",
          children: [{ _key: "b", _type: "span", marks: [], text: "Built reliable systems." }],
          markDefs: [],
          style: "normal",
        },
      ],
      role: "Software Engineer",
      slug: "example-co",
      summary: "Platform engineering.",
      technologies: ["TypeScript", "Next.js"],
      updatedAt: "2026-08-03T00:00:00.000Z",
    },
  ],
  profile: {
    _id: "profile",
    aboutContent: [
      {
        _key: "about",
        _type: "block",
        children: [{ _key: "text", _type: "span", marks: [], text: "About Zomer." }],
        markDefs: [],
        style: "normal",
      },
    ],
    biography: [
      {
        _key: "bio",
        _type: "block",
        children: [{ _key: "text", _type: "span", marks: [], text: "Software engineer." }],
        markDefs: [],
        style: "normal",
      },
    ],
    email: "public@example.com",
    githubUrl: "https://github.com/example",
    linkedinUrl: "https://linkedin.com/in/example",
    name: "Zomer Gregorio",
    photo: null,
    resumeUrl: null,
    role: "Software Engineer",
    secret: "must not leak",
  },
  projects: [
    {
      caseStudyUrl: null,
      demoUrl: "https://demo.example.com",
      description: "A public project.",
      details: [],
      image: null,
      internalId: "secret-project-id",
      repositoryUrl: "https://github.com/example/project",
      slug: "public-project",
      technologies: ["TypeScript"],
      title: "Public Project",
      updatedAt: "2026-08-04T00:00:00.000Z",
      year: "2026",
    },
  ],
  techStack: [{ items: ["TypeScript", "Next.js"], name: "Web" }],
};

export const rawPublicBlogPostFixture = {
  body: "## Article body",
  date: "2026-08-01T00:00:00.000Z",
  description: "A published article.",
  internalId: "secret-blog-id",
  readTime: 4,
  slug: "published-article",
  tags: ["Next.js"],
  title: "Published Article",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

export function createTestPublicPortfolioService(): PublicPortfolioService {
  return {
    async getBlogPost(slug) {
      return slug === "published-article"
        ? {
            body: "## Article body",
            canonicalUrl: "https://portfolio.example/blogs/published-article",
            date: "2026-08-01T00:00:00.000Z",
            description: "A published article.",
            readTimeMinutes: 4,
            slug,
            tags: ["Next.js"],
            title: "Published Article",
            updatedAt: "2026-08-02T00:00:00.000Z",
          }
        : null;
    },
    async getProfile() {
      return {
        about: "About Zomer.",
        biography: "Software engineer.",
        email: "public@example.com",
        links: {
          email: "mailto:public@example.com",
          github: "https://github.com/example",
          linkedin: "https://linkedin.com/in/example",
          resume: "https://portfolio.example/assets/GREGORIO_ZOMER_RESUME.pdf",
          website: "https://portfolio.example/",
        },
        name: "Zomer Gregorio",
        photo: null,
        resumePdfUrl: "https://portfolio.example/assets/GREGORIO_ZOMER_RESUME.pdf",
        role: "Software Engineer",
        url: "https://portfolio.example/",
      };
    },
    async getExperience(slug) {
      return (await this.listExperience()).items.find((item) => item.slug === slug) ?? null;
    },
    async getProject(slug) {
      return (await this.listProjects()).items.find((item) => item.slug === slug) ?? null;
    },
    async getResume() {
      const profile = await this.getProfile();
      if (!profile) return null;
      return {
        contact: {
          email: profile.email,
          github: profile.links.github,
          linkedin: profile.links.linkedin,
          website: profile.url,
        },
        experience: (await this.listExperience()).items,
        name: profile.name,
        pdfUrl: profile.resumePdfUrl,
        role: profile.role,
        summary: profile.biography,
        techStack: (await this.listTechStack()).groups,
      };
    },
    async getSnapshot() {
      return {
        blogs: (await this.listBlogPosts()).items,
        experience: (await this.listExperience()).items,
        profile: await this.getProfile(),
        projects: (await this.listProjects()).items,
        techStack: (await this.listTechStack()).groups,
      };
    },
    async listBlogPosts({ limit = 10, offset = 0, query = "" } = {}) {
      const posts = [
        {
          canonicalUrl: "https://portfolio.example/blogs/published-article",
          date: "2026-08-01T00:00:00.000Z",
          description: "A published article.",
          slug: "published-article",
          tags: ["Next.js"],
          title: "Published Article",
        },
      ];
      const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
      const items = normalizedQuery
        ? posts.filter((post) => post.title.toLocaleLowerCase("en-US").includes(normalizedQuery))
        : posts;

      return { items: items.slice(offset, offset + limit), limit, offset, total: items.length };
    },
    async listExperience() {
      return {
        items: [
          {
            canonicalUrl: "https://portfolio.example/work/example-co",
            company: "Example Co",
            companyUrl: "https://example.com",
            details: [
              {
                content: [{ style: "bullet", text: "Improved the API." }],
                title: "Technical work",
              },
            ],
            location: "Remote",
            period: "2024–Present",
            responsibilities: ["Built reliable systems."],
            role: "Software Engineer",
            slug: "example-co",
            summary: "Platform engineering.",
            technologies: ["TypeScript", "Next.js"],
            updatedAt: "2026-08-03T00:00:00.000Z",
          },
        ],
        total: 1,
      };
    },
    async listProjects() {
      return {
        items: [
          {
            canonicalUrl: "https://portfolio.example/projects/public-project",
            caseStudyUrl: null,
            demoUrl: "https://demo.example.com",
            description: "A public project.",
            details: [],
            image: null,
            repositoryUrl: "https://github.com/example/project",
            slug: "public-project",
            technologies: ["TypeScript"],
            title: "Public Project",
            updatedAt: "2026-08-04T00:00:00.000Z",
            year: "2026",
          },
        ],
        total: 1,
      };
    },
    async listTechStack() {
      return { groups: [{ items: ["TypeScript", "Next.js"], name: "Web" }], total: 1 };
    },
  };
}
