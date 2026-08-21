import { defineQuery } from "next-sanity";

export const PROFILE_QUERY = defineQuery(/* groq */ `
  *[_id == "profile"][0] {
    _id,
    name,
    role,
    email,
    githubUrl,
    linkedinUrl,
    biography,
    aboutContent,
    photo {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions { width, height }
        }
      },
      alt,
      hotspot,
      crop
    },
    "resumeUrl": resume.asset->url
  }
`);

export const EXPERIENCE_QUERY = defineQuery(/* groq */ `
  *[_type == "experience"] | order(order desc, _id asc) {
    _id,
    role,
    company,
    period,
    technologies
  }
`);

export const PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project"] | order(order desc, _id asc) {
    _id,
    title,
    year,
    description,
    image {
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions { width, height }
        }
      },
      alt,
      hotspot,
      crop
    },
    technologies,
    demoUrl,
    repositoryUrl,
    caseStudyUrl
  }
`);

export const BLOG_POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && defined(slug.current) && defined(publishedAt)]
  | order(publishedAt desc, _id asc) {
    _id,
    title,
    "slug": slug.current,
    "date": publishedAt,
    "description": excerpt,
    tags
  }
`);

export const BLOG_POST_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    "slug": slug.current,
    "date": publishedAt,
    "description": excerpt,
    tags,
    body,
    readTime
  }
`);

export const BLOG_POST_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && defined(slug.current) && defined(publishedAt)] | order(_id asc) {
    "slug": slug.current
  }
`);

export const TECH_STACK_QUERY = defineQuery(/* groq */ `
  *[_type == "techStack"] | order(order asc, _id asc) {
    _id,
    name,
    items,
    order
  }
`);
