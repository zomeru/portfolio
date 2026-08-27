import { FolderIcon } from "@sanity/icons/Folder";
import { defineArrayMember, defineField, defineType, type SchemaTypeDefinition } from "sanity";

export const project: SchemaTypeDefinition = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Stable public URL segment for the project detail page.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
              ? true
              : "Use lowercase letters, numbers, and single hyphens only.",
          ),
    }),
    defineField({
      name: "year",
      type: "string",
      validation: (rule) => rule.required().regex(/^\d{4}$/, { name: "year" }),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "details",
      title: "Detail page content",
      description:
        "Optional structured technical content. Use headings for context, architecture, implementation, decisions, challenges, tradeoffs, security, integrations, and outcomes.",
      type: "richText",
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
