import type {
  BLOG_POSTS_QUERY_RESULT,
  EXPERIENCE_QUERY_RESULT,
  PROFILE_QUERY_RESULT,
  PROJECTS_QUERY_RESULT,
  TECH_STACK_QUERY_RESULT,
} from "./sanity.types";

export type Profile = Exclude<PROFILE_QUERY_RESULT, null>;
export type Experience = EXPERIENCE_QUERY_RESULT[number];
export type Project = PROJECTS_QUERY_RESULT[number];
export type BlogPostListItem = BLOG_POSTS_QUERY_RESULT[number];
export type TechStackGroup = TECH_STACK_QUERY_RESULT[number];

export type ProfileSocial = {
  name: "Email" | "GitHub" | "LinkedIn";
  href: string;
};
