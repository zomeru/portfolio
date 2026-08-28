import { defineQuery } from "groq";

const PUBLISHED_FILTER = `!(_id in path("drafts.**"))`;

const PROFILE_PROJECTION = /* groq */ `{
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
}`;

const EXPERIENCE_PROJECTION = /* groq */ `{
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
}`;

const PROJECT_PROJECTION = /* groq */ `{
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
}`;

const BLOG_SUMMARY_PROJECTION = /* groq */ `{
  title,
  "slug": slug.current,
  "date": publishedAt,
  "description": excerpt,
  tags
}`;

const TECH_STACK_PROJECTION = /* groq */ `{
  name,
  items
}`;

export const PUBLIC_PROFILE_QUERY = defineQuery(/* groq */ `
  *[_id == "profile" && ${PUBLISHED_FILTER}][0] ${PROFILE_PROJECTION}
`);

export const PUBLIC_EXPERIENCE_LIST_QUERY = defineQuery(/* groq */ `
  *[_type == "experience" && ${PUBLISHED_FILTER}]
    | order(order desc, _id asc) ${EXPERIENCE_PROJECTION}
`);

export const PUBLIC_EXPERIENCE_QUERY = defineQuery(/* groq */ `
  *[
    _type == "experience" &&
    ${PUBLISHED_FILTER} &&
    slug.current == $slug
  ][0] ${EXPERIENCE_PROJECTION}
`);

export const PUBLIC_PROJECT_LIST_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && ${PUBLISHED_FILTER}]
    | order(order desc, _id asc) ${PROJECT_PROJECTION}
`);

export const PUBLIC_PROJECT_QUERY = defineQuery(/* groq */ `
  *[
    _type == "project" &&
    ${PUBLISHED_FILTER} &&
    slug.current == $slug
  ][0] ${PROJECT_PROJECTION}
`);

export const PUBLIC_BLOG_POST_LIST_QUERY = defineQuery(/* groq */ `
  *[
    _type == "blogPost" &&
    ${PUBLISHED_FILTER} &&
    defined(slug.current) &&
    defined(publishedAt)
  ] | order(publishedAt desc, _id asc) ${BLOG_SUMMARY_PROJECTION}
`);

export const PUBLIC_TECH_STACK_QUERY = defineQuery(/* groq */ `
  *[_type == "techStack" && ${PUBLISHED_FILTER}]
    | order(order asc, _id asc) ${TECH_STACK_PROJECTION}
`);

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
