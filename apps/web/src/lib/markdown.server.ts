import "@tanstack/react-start/server-only";
import type { Root, RootContent } from "hast";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const MAX_CACHED_RENDERS = 8;
const MAX_CACHED_MARKDOWN_LENGTH = 32 * 1024;
const MAX_CACHED_HTML_LENGTH = 128 * 1024;
const rendered = new Map<string, string>();

function hasHighlightedCode(node: Root | RootContent): boolean {
  if (node.type === "element" && node.tagName === "code") {
    const classes = node.properties.className;
    const first = node.children[0];
    return (
      (Array.isArray(classes) && classes.some((name) => String(name).startsWith("language-"))) ||
      (first?.type === "text" && /{:[a-zA-Z.-]+}$/.test(first.value))
    );
  }
  return "children" in node && node.children.some(hasHighlightedCode);
}

function updateLinks(node: Root | RootContent, externalLinkLabel: string) {
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
    for (const child of node.children) updateLinks(child, externalLinkLabel);
  }
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(() => async (tree: Root, file) => {
    if (hasHighlightedCode(tree)) {
      const { syntaxHighlighter } = await import("./highlight-markdown.server");
      await syntaxHighlighter.run(tree);
    }
    const label = file.data.externalLinkLabel;
    if (typeof label === "string" && label) updateLinks(tree, label);
  })
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string, externalLinkLabel?: string) {
  if (!markdown) return "";
  const key =
    markdown.length <= MAX_CACHED_MARKDOWN_LENGTH
      ? JSON.stringify([markdown, externalLinkLabel])
      : undefined;
  const cached = key === undefined ? undefined : rendered.get(key);
  if (cached !== undefined) return cached;

  const html = String(
    await markdownProcessor.process({ value: markdown, data: { externalLinkLabel } }),
  );
  // A content edit changes the key. Keep large articles out of the isolate cache.
  if (key !== undefined && html.length <= MAX_CACHED_HTML_LENGTH) {
    if (rendered.size >= MAX_CACHED_RENDERS) {
      const oldest = rendered.keys().next().value;
      if (oldest !== undefined) rendered.delete(oldest);
    }
    rendered.set(key, html);
  }
  return html;
}
