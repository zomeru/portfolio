import { toPlainText } from "@portabletext/toolkit";

type PortableTextValue = Parameters<typeof toPlainText>[0];

export function portableTextToPlainText(value: unknown) {
  if (!Array.isArray(value)) return "";

  try {
    return toPlainText(value as PortableTextValue).trim();
  } catch {
    return "";
  }
}

export function portableTextToParagraphs(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => portableTextToPlainText([block]))
    .filter((paragraph): paragraph is string => Boolean(paragraph));
}

export type PortableTextDetailSection = {
  content: Array<{ style: "bullet" | "number" | "paragraph"; text: string }>;
  title: string;
};

export function portableTextToDetailSections(value: unknown): PortableTextDetailSection[] {
  if (!Array.isArray(value)) return [];

  const sections: PortableTextDetailSection[] = [];
  let current: PortableTextDetailSection | undefined;

  for (const block of value) {
    if (!block || typeof block !== "object") continue;
    const text = portableTextToPlainText([block]);
    if (!text) continue;

    const style = "style" in block && typeof block.style === "string" ? block.style : "normal";
    if (style === "h2" || style === "h3") {
      if (current?.content.length) sections.push(current);
      current = { content: [], title: text };
      continue;
    }

    current ??= { content: [], title: "Overview" };
    const listItem =
      "listItem" in block && typeof block.listItem === "string" ? block.listItem : undefined;
    current.content.push({
      style: listItem === "bullet" ? "bullet" : listItem === "number" ? "number" : "paragraph",
      text,
    });
  }

  if (current?.content.length) sections.push(current);
  return sections;
}
