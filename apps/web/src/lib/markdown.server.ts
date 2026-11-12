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

// Keep the web bundle small while retaining the additional fences used by the blog.
const extraLanguages = [
  () => import("shiki/dist/langs/dockerfile.mjs"),
  () => import("shiki/dist/langs/hcl.mjs"),
  () => import("shiki/dist/langs/mermaid.mjs"),
  () => import("shiki/dist/langs/prisma.mjs"),
  () => import("shiki/dist/langs/swift.mjs"),
  () => import("shiki/dist/langs/toml.mjs"),
];

export async function renderMarkdown(markdown: string, externalLinkLabel?: string) {
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
        createHighlighter({
          ...options,
          langs: [...options.langs, ...extraLanguages],
          engine: createJavaScriptRegexEngine(),
        }),
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
