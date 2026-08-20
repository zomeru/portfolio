import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "role", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "email", type: "string", validation: (rule) => rule.required().email() }),
    defineField({ name: "biography", type: "richText" }),
    defineField({ name: "resumeUrl", title: "Resume URL", type: "url" }),
    defineField({
      name: "socialLinks",
      type: "array",
      of: [defineArrayMember({ type: "socialLink" })],
    }),
  ],
  preview: { select: { title: "name", subtitle: "role" } },
});
