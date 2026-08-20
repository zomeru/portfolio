import type { PortableTextBlock, PortableTextComponents } from "next-sanity";
import { PortableText } from "next-sanity";

import type { RichText } from "./sanity.types";

const bodyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
    h2: ({ children }) => <h2 className="mb-3 mt-8 text-lg font-medium">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-6 font-medium">{children}</h3>,
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => {
      if (typeof value?.href !== "string") return <>{children}</>;

      const href = value.href;
      const external = href.startsWith("http://") || href.startsWith("https://");

      return (
        <a
          href={href}
          className="underline underline-offset-4 transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

const inlineComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <>{children}</>,
    h2: ({ children }) => <>{children}</>,
    h3: ({ children }) => <>{children}</>,
  },
  marks: bodyComponents.marks,
};

type PortableTextContentProps = {
  value: RichText | null | undefined;
  variant?: "body" | "inline";
};

export function PortableTextContent({ value, variant = "body" }: PortableTextContentProps) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return (
    <PortableText
      value={value as PortableTextBlock[]}
      components={variant === "inline" ? inlineComponents : bodyComponents}
    />
  );
}

export function portableTextToPlainText(value: RichText | null | undefined): string {
  if (!Array.isArray(value)) return "";

  return value
    .map((block) =>
      block._type === "block" && Array.isArray(block.children)
        ? block.children
            .map((child) => ("text" in child && typeof child.text === "string" ? child.text : ""))
            .join("")
        : "",
    )
    .filter(Boolean)
    .join("\n\n");
}
