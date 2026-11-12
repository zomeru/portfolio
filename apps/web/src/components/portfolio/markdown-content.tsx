import "./markdown-content.css";

export function MarkdownContent({ html }: { html: string }) {
  if (!html) return null;
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
