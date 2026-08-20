import { CodeIcon } from "@sanity/icons/Code";
import { defineArrayMember, defineField, defineType } from "sanity";

const API_VERSION = "2026-08-20";

export const techStack = defineType({
  name: "techStack",
  title: "Tech stack group",
  type: "document",
  icon: CodeIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required().min(1).max(60),
    }),
    defineField({
      name: "items",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower values appear first.",
      validation: (rule) =>
        rule
          .required()
          .integer()
          .min(0)
          .custom(async (order, context) => {
            if (order === undefined) return true;

            const documentId = context.document?._id?.replace(/^drafts\./, "");
            const duplicateCount = await context
              .getClient({ apiVersion: API_VERSION })
              .fetch<number>(
                `count(*[_type == "techStack" && order == $order && !(_id in [$id, "drafts." + $id])])`,
                { id: documentId ?? "", order },
              );

            return duplicateCount === 0 || "Each tech stack group must have a unique order.";
          }),
    }),
  ],
  preview: {
    select: { title: "name", items: "items", order: "order" },
    prepare: ({ title, items, order }) => ({
      title,
      subtitle: `${Array.isArray(items) ? items.length : 0} technologies · Order ${String(order)}`,
    }),
  },
  orderings: [
    { title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
});
