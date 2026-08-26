import { BLOG_CONTENT_LIMITS } from "@portfolio/content/blog";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType, type SchemaTypeDefinition } from "sanity";

export const blogPost: SchemaTypeDefinition = defineType({
  name: "blogPost",
  title: "Blog post",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => [
        rule.required(),
        rule
          .max(BLOG_CONTENT_LIMITS.title.maximumCharacters)
          .warning(`Keep titles under ${BLOG_CONTENT_LIMITS.title.maximumCharacters} characters.`),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: BLOG_CONTENT_LIMITS.slug.maximumCharacters },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => [
        rule.required(),
        rule
          .max(BLOG_CONTENT_LIMITS.excerpt.maximumCharacters)
          .warning(
            `Keep excerpts under ${BLOG_CONTENT_LIMITS.excerpt.maximumCharacters} characters.`,
          ),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 20,
      description: "Blog content in Markdown format.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "publishedAt", type: "datetime", validation: (rule) => rule.required() }),
    defineField({ name: "updatedAt", type: "datetime" }),
    defineField({
      name: "tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "source",
      type: "string",
      options: {
        list: [
          { title: "Manual", value: "manual" },
          { title: "Assisted", value: "assisted" },
          { title: "Automated", value: "automated" },
        ],
        layout: "radio",
      },
      initialValue: "manual",
    }),
    defineField({
      name: "readTime",
      title: "Read time (minutes)",
      type: "number",
      validation: (rule) =>
        rule
          .integer()
          .min(BLOG_CONTENT_LIMITS.readTime.minimumMinutes)
          .max(BLOG_CONTENT_LIMITS.readTime.maximumMinutes),
    }),
    defineField({
      name: "generation",
      title: "AI generation",
      type: "object",
      description: "Server-recorded metadata for AI-generated posts.",
      readOnly: true,
      fields: [
        defineField({ name: "provider", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "model", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "key", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "trigger",
          type: "string",
          options: {
            list: [
              { title: "Scheduled", value: "scheduled" },
              { title: "Manual", value: "manual" },
            ],
            layout: "radio",
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "generatedAt",
          type: "datetime",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", publishedAt: "publishedAt" },
    prepare: ({ title, publishedAt }) => ({
      title,
      subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString() : "Unpublished",
    }),
  },
  orderings: [
    {
      title: "Published, newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
