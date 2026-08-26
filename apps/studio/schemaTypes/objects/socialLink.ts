import { LinkIcon } from "@sanity/icons/Link";
import { defineField, defineType, type SchemaTypeDefinition } from "sanity";

export const socialLink: SchemaTypeDefinition = defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "url",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https", "mailto"] }),
    }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});
