import "@tanstack/react-start/server-only";
import rehypePrettyCode from "rehype-pretty-code";
import { unified } from "unified";

export const syntaxHighlighter = unified().use(rehypePrettyCode, {
  keepBackground: false,
  theme: { dark: "github-dark", light: "github-light" },
});
