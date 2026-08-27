import { defineQuery } from "groq";

const PUBLISHED_FILTER = `!(_id in path("drafts.**"))`;

export const PUBLIC_PORTFOLIO_SNAPSHOT_QUERY = defineQuery(/* groq */ `{
  "profile": *[_id == "profile" && ${PUBLISHED_FILTER}][0] {
    name,
    role,
    email,
    githubUrl,
    linkedinUrl,
    biography,
    aboutContent,
    photo {
      asset->{
        url,
        metadata {
          lqip,
          dimensions { width, height }
        }
      },
      alt
    },
    "resumeUrl": resume.asset->url
  },
  "experience": *[_type == "experience" && ${PUBLISHED_FILTER}]
    | order(order desc, _id asc) {
      "updatedAt": _updatedAt,
      role,
      company,
      "slug": slug.current,
      location,
      period,
      summary,
      responsibilities,
      details,
      technologies,
      companyUrl
    },
  "projects": *[_type == "project" && ${PUBLISHED_FILTER}]
    | order(order desc, _id asc) {
      "updatedAt": _updatedAt,
      title,
      "slug": slug.current,
      year,
      description,
      details,
      image {
        asset->{
          url,
          metadata {
            lqip,
            dimensions { width, height }
          }
        },
        alt
      },
      technologies,
      demoUrl,
      repositoryUrl,
      caseStudyUrl
    },
  "blogs": *[
    _type == "blogPost" &&
    ${PUBLISHED_FILTER} &&
    defined(slug.current) &&
    defined(publishedAt)
  ] | order(publishedAt desc, _id asc) {
    title,
    "slug": slug.current,
    "date": publishedAt,
    "description": excerpt,
    tags
  },
  "techStack": *[_type == "techStack" && ${PUBLISHED_FILTER}]
    | order(order asc, _id asc) {
      name,
      items
    }
}`);

export const PUBLIC_BLOG_POST_QUERY = defineQuery(/* groq */ `
  *[
    _type == "blogPost" &&
    ${PUBLISHED_FILTER} &&
    slug.current == $slug &&
    defined(publishedAt)
  ][0] {
    title,
    "slug": slug.current,
    "date": publishedAt,
    "description": excerpt,
    tags,
    body,
    readTime,
    updatedAt
  }
`);
