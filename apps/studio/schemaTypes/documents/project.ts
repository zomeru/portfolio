import { FolderIcon } from "@sanity/icons/Folder";
import { defineArrayMember, defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "year",
      type: "string",
      validation: (rule) => rule.required().regex(/^\\d{4}$/, { name: "year" }),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", type: "string", validation: (rule) => rule.required() })],
    }),
    defineField({
      name: "technologies",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "demoUrl",
      title: "Demo URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "repositoryUrl",
      title: "Repository URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "caseStudyUrl",
      title: "Case study URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Higher values appear first.",
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  preview: { select: { title: "title", subtitle: "year", media: "image" } },
  orderings: [
    { title: "Display order", name: "orderDesc", by: [{ field: "order", direction: "desc" }] },
  ],
});
