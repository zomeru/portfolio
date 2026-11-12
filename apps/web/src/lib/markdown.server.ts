import "@tanstack/react-start/server-only";
import type { Root, RootContent } from "hast";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";

import type { RichText } from "@/lib/sanity/sanity.types";

function wrapInlineCode(value: string) {
  const longestRun = Math.max(0, ...Array.from(value.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestRun + 1);
  return `${fence}${value}${fence}`;
}

function renderSpan(
  span: NonNullable<RichText[number]["children"]>[number],
  markDefs: NonNullable<RichText[number]["markDefs"]>,
) {
  let value = span.text ?? "";

  for (const mark of span.marks ?? []) {
    if (mark === "code") {
      if (value.includes("\n")) {
        if (!value.trimStart().startsWith("```")) value = `\`\`\`\n${value}\n\`\`\``;
      } else if (!(value.startsWith("`") && value.endsWith("`"))) {
        value = wrapInlineCode(value);
      }
      continue;
    }

    if (mark === "strong") value = `**${value}**`;
    else if (mark === "em") value = `*${value}*`;
    else {
      const definition = markDefs.find((item) => item._key === mark);
      if (definition?.href) value = `[${value}](${definition.href})`;
    }
  }

  return value;
}

function renderBlock(block: RichText[number]) {
  const markDefs = block.markDefs ?? [];
  const value = (block.children ?? []).map((span) => renderSpan(span, markDefs)).join("");

  if (!value) return "";
  if (block.listItem) {
    const indentation = "  ".repeat(Math.max(0, (block.level ?? 1) - 1));
    const marker = block.listItem === "number" ? "1." : "-";
    return `${indentation}${marker} ${value.replaceAll("\n", `\n${indentation}  `)}`;
  }

  if (block.style === "h2") return value.startsWith("#") ? value : `## ${value}`;
  if (block.style === "h3") return value.startsWith("#") ? value : `### ${value}`;
  if ((block.style as string) === "blockquote") return `> ${value.replaceAll("\n", "\n> ")}`;

  return value;
}

function portableTextToMarkdown(value: RichText | string | null | undefined) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value.reduce((markdown, block, index) => {
    const rendered = renderBlock(block);
    if (!rendered) return markdown;

    const previous = value[index - 1];
    const separator =
      markdown && previous?.listItem && block.listItem ? "\n" : markdown ? "\n\n" : "";
    return `${markdown}${separator}${rendered}`;
  }, "");
}

export async function renderMarkdown(value: RichText | string | null, externalLinkLabel?: string) {
  const markdown = portableTextToMarkdown(value);
  if (!markdown) return "";
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypePrettyCode, {
      keepBackground: false,
      theme: { dark: "github-dark", light: "github-light" },
      getHighlighter: (options) =>
        createHighlighter({ ...options, engine: createJavaScriptRegexEngine() }),
    })
    .use(() => (tree: Root) => {
      if (!externalLinkLabel) return;
      function updateLinks(node: Root | RootContent) {
        if (node.type === "element" && node.tagName === "a") {
          node.properties.target = "_blank";
          node.properties.rel = ["noopener", "noreferrer"];
          node.children.push({
            type: "element",
            tagName: "span",
            properties: { className: ["sr-only"] },
            children: [{ type: "text", value: ` ${externalLinkLabel}` }],
          });
        }
        if ("children" in node) {
          for (const child of node.children) updateLinks(child);
        }
      }
      updateLinks(tree);
    })
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}
