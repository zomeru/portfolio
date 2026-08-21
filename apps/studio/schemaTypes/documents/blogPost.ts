import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType } from "sanity";

export const blogPost = defineType({
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
        rule.max(100).warning("Keep titles under 100 characters."),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => [
        rule.required(),
        rule.max(300).warning("Keep excerpts under 300 characters."),
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
      validation: (rule) => rule.integer().min(1).max(60),
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
