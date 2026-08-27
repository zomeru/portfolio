import { CaseIcon } from "@sanity/icons/Case";
import { defineArrayMember, defineField, defineType, type SchemaTypeDefinition } from "sanity";

export const experience: SchemaTypeDefinition = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  icon: CaseIcon,
  fields: [
    defineField({ name: "role", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "company", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Stable public URL segment for the work detail page.",
      options: { source: "company", maxLength: 96 },
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
              ? true
              : "Use lowercase letters, numbers, and single hyphens only.",
          ),
    }),
    defineField({ name: "location", type: "string" }),
    defineField({
      name: "period",
      description: 'e.g., "Mar. 2025 — Present"',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "summary", type: "text", rows: 3 }),
    defineField({ name: "responsibilities", type: "richText" }),
    defineField({
      name: "details",
      title: "Detail page content",
      description:
        "Optional structured sections for problems solved, technical decisions, accomplishments, performance work, and lessons. Use headings to name each section.",
      type: "richText",
    }),
    defineField({
      name: "technologies",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "companyUrl",
      title: "Company URL",
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
  preview: {
    select: { title: "role", company: "company", period: "period" },
    prepare: ({ title, company, period }) => ({
      title,
      subtitle: [company, period].filter(Boolean).join(" · "),
    }),
  },
  orderings: [
    { title: "Display order", name: "orderDesc", by: [{ field: "order", direction: "desc" }] },
  ],
});
