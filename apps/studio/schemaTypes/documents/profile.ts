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
    defineField({
      name: "githubUrl",
      title: "GitHub URL",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "photo",
      title: "Profile photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "resume",
      title: "Resume",
      type: "file",
      options: { accept: ".pdf" },
    }),
    defineField({
      name: "biography",
      title: "Biography",
      type: "richText",
      description: "Short introductory text displayed at the top of the About page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "aboutContent",
      title: "About content",
      type: "richText",
      description: "Additional About-page content displayed below the introduction.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "resumeUrl",
      title: "Resume URL (deprecated)",
      type: "url",
      deprecated: { reason: "Use the Resume file field instead." },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      initialValue: undefined,
    }),
    defineField({
      name: "socialLinks",
      title: "Social links (deprecated)",
      type: "array",
      of: [defineArrayMember({ type: "socialLink" })],
      deprecated: { reason: "Use the dedicated GitHub and LinkedIn URL fields instead." },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      initialValue: undefined,
    }),
  ],
  preview: { select: { title: "name", subtitle: "role" } },
});
