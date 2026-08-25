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
