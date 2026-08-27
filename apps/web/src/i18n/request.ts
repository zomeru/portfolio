import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "./routing";

type MessageLoader = () => Promise<{
  Assistant: typeof import("../../messages/en/assistant.json");
  Blogs: typeof import("../../messages/en/blogs.json");
  Common: typeof import("../../messages/en/common.json");
  Contact: typeof import("../../messages/en/contact.json");
  Developers: typeof import("../../messages/en/developers.json");
  Errors: typeof import("../../messages/en/errors.json");
  Experience: typeof import("../../messages/en/experience.json");
  Github: typeof import("../../messages/en/github.json");
  Home: typeof import("../../messages/en/home.json");
  Metadata: typeof import("../../messages/en/metadata.json");
  Projects: typeof import("../../messages/en/projects.json");
}>;

function createMessageLoader(locale: Locale): MessageLoader {
  return async () => {
    const [
      Assistant,
      Blogs,
      Common,
      Contact,
      Developers,
      Errors,
      Experience,
      Github,
      Home,
      Metadata,
      Projects,
    ] = await Promise.all([
      import(`../../messages/${locale}/assistant.json`),
      import(`../../messages/${locale}/blogs.json`),
      import(`../../messages/${locale}/common.json`),
      import(`../../messages/${locale}/contact.json`),
      import(`../../messages/${locale}/developers.json`),
      import(`../../messages/${locale}/errors.json`),
      import(`../../messages/${locale}/experience.json`),
      import(`../../messages/${locale}/github.json`),
      import(`../../messages/${locale}/home.json`),
      import(`../../messages/${locale}/metadata.json`),
      import(`../../messages/${locale}/projects.json`),
    ]);

    return {
      Assistant: Assistant.default,
      Blogs: Blogs.default,
      Common: Common.default,
      Contact: Contact.default,
      Developers: Developers.default,
      Errors: Errors.default,
      Experience: Experience.default,
      Github: Github.default,
      Home: Home.default,
      Metadata: Metadata.default,
      Projects: Projects.default,
    };
  };
}

const messageLoaders = {
  en: createMessageLoader("en"),
  ja: createMessageLoader("ja"),
  "zh-CN": createMessageLoader("zh-CN"),
  de: createMessageLoader("de"),
} satisfies Record<Locale, MessageLoader>;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: await messageLoaders[locale](),
  };
});
