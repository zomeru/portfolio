import { blogPost } from "./documents/blogPost";
import { experience } from "./documents/experience";
import { profile } from "./documents/profile";
import { project } from "./documents/project";
import { richText } from "./objects/richText";
import { socialLink } from "./objects/socialLink";

export const schemaTypes = [richText, socialLink, profile, experience, project, blogPost];
