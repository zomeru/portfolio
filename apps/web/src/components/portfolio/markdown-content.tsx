import { MarkdownAsync } from "react-markdown";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import type { RichText } from "@/lib/sanity/sanity.types";

type MarkdownContentProps = {
  openLinksInNewTab?: boolean;
  value: RichText | string | null | undefined;
};

const prettyCodeOptions: PrettyCodeOptions = {
  keepBackground: false,
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
};

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

export async function MarkdownContent({ openLinksInNewTab = false, value }: MarkdownContentProps) {
  const markdown = portableTextToMarkdown(value);
  if (!markdown) return null;

  return (
    <div className="markdown-content">
      <MarkdownAsync
        components={
          openLinksInNewTab
            ? {
                a: ({ children, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer">
                    {children}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ),
              }
            : undefined
        }
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, prettyCodeOptions]]}
      >
        {markdown}
      </MarkdownAsync>
    </div>
  );
}
