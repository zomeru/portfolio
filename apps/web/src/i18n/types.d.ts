import type assistant from "../../messages/en/assistant.json";
import type blogs from "../../messages/en/blogs.json";
import type common from "../../messages/en/common.json";
import type contact from "../../messages/en/contact.json";
import type developers from "../../messages/en/developers.json";
import type errors from "../../messages/en/errors.json";
import type experience from "../../messages/en/experience.json";
import type github from "../../messages/en/github.json";
import type home from "../../messages/en/home.json";
import type metadata from "../../messages/en/metadata.json";
import type projects from "../../messages/en/projects.json";
import type { Locale } from "./routing";

type Messages = {
  Assistant: typeof assistant;
  Blogs: typeof blogs;
  Common: typeof common;
  Contact: typeof contact;
  Developers: typeof developers;
  Errors: typeof errors;
  Experience: typeof experience;
  Github: typeof github;
  Home: typeof home;
  Metadata: typeof metadata;
  Projects: typeof projects;
};

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
