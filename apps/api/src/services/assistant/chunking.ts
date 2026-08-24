import type { KnowledgeChunkInput, NormalizedKnowledgeDocument, NormalizedSection } from "./types";

const DEFAULT_TARGET_CHUNK_CHARACTERS = 2_800;
const DEFAULT_MAX_CHUNK_CHARACTERS = 3_400;
const BLOG_TARGET_CHUNK_CHARACTERS = 2_400;
const BLOG_MAX_CHUNK_CHARACTERS = 3_200;

function approximateTokenCount(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function semanticBlocks(value: string) {
  const blocks: string[] = [];
  let current: string[] = [];
  let inCodeFence = false;

  const flush = () => {
    const block = current.join("\n").trim();
    if (block) blocks.push(block);
    current = [];
  };

  for (const line of value.split("\n")) {
    if (/^\s*```/.test(line)) inCodeFence = !inCodeFence;
    if (!inCodeFence && !line.trim()) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();

  return blocks;
}

function splitOversizedBlock(value: string, maxCharacters: number) {
  if (/^\s*```/.test(value)) return [value];

  const units = value
    .split(/\n(?=\s*(?:[-*+] |\d+[.)] ))|(?<=[.!?])\s+/)
    .map((unit) => unit.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  let current = "";

  const flush = () => {
    if (current) pieces.push(current);
    current = "";
  };

  const splitLongUnit = (unit: string) => {
    const words = unit.split(/\s+/);
    let piece = "";
    for (const word of words) {
      if (word.length > maxCharacters) {
        if (piece) pieces.push(piece);
        piece = "";
        for (let start = 0; start < word.length; start += maxCharacters) {
          pieces.push(word.slice(start, start + maxCharacters));
        }
        continue;
      }
      if (piece && piece.length + word.length + 1 > maxCharacters) {
        pieces.push(piece);
        piece = "";
      }
      piece = piece ? `${piece} ${word}` : word;
    }
    if (piece) pieces.push(piece);
  };

  for (const unit of units) {
    if (unit.length > maxCharacters) {
      flush();
      splitLongUnit(unit);
      continue;
    }
    if (current && current.length + unit.length + 1 > maxCharacters) flush();
    current = current ? `${current}\n${unit}` : unit;
  }
  flush();

  return pieces;
}

function splitLongSection(value: string, maxCharacters: number) {
  const groups: string[] = [];
  let current = "";

  const flush = () => {
    if (current) groups.push(current);
    current = "";
  };

  for (const block of semanticBlocks(value)) {
    const pieces =
      block.length > maxCharacters ? splitOversizedBlock(block, maxCharacters) : [block];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > maxCharacters) flush();
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  flush();

  return groups;
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function metadataList(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function embeddingContext(
  document: NormalizedKnowledgeDocument,
  headingPaths: readonly string[][],
) {
  const lines = ["Portfolio owner: Zomer Gregorio"];

  if (document.sourceType === "profile") {
    lines.push("Content type: Profile", `Person: ${document.title}`);
    const role = metadataString(document.metadata, "role");
    if (role) lines.push(`Role: ${role}`);
  } else if (document.sourceType === "experience") {
    lines.push("Content type: Work experience");
    for (const [label, key] of [
      ["Company", "company"],
      ["Role", "role"],
      ["Period", "period"],
    ] as const) {
      const value = metadataString(document.metadata, key);
      if (value) lines.push(`${label}: ${value}`);
    }
  } else if (document.sourceType === "project") {
    lines.push("Content type: Project", `Project: ${document.title}`);
    const year = metadataString(document.metadata, "year");
    if (year) lines.push(`Year: ${year}`);
  } else if (document.sourceType === "blog") {
    lines.push("Content type: Blog article", `Article: ${document.title}`);
    const publishedAt = metadataString(document.metadata, "publishedAt");
    if (publishedAt) lines.push(`Published: ${publishedAt}`);
  } else {
    lines.push("Content type: Technology stack", `Category: ${document.title}`);
  }

  const technologies = metadataList(document.metadata, "technologies");
  if (technologies.length > 0) lines.push(`Technologies: ${technologies.join(", ")}`);
  const tags = metadataList(document.metadata, "tags");
  if (tags.length > 0) lines.push(`Tags: ${tags.join(", ")}`);
  if (headingPaths.length > 0) {
    lines.push(`Sections: ${headingPaths.map((path) => path.join(" > ")).join(" | ")}`);
  }

  return lines.join("\n");
}

function sectionPath(section: NormalizedSection) {
  return section.headingPath?.length ? section.headingPath : [section.heading];
}

export function chunkKnowledgeDocument(
  document: NormalizedKnowledgeDocument,
): KnowledgeChunkInput[] {
  const targetCharacters =
    document.sourceType === "blog" ? BLOG_TARGET_CHUNK_CHARACTERS : DEFAULT_TARGET_CHUNK_CHARACTERS;
  const maxCharacters =
    document.sourceType === "blog" ? BLOG_MAX_CHUNK_CHARACTERS : DEFAULT_MAX_CHUNK_CHARACTERS;
  const chunks: Array<{ content: string; headingPaths: string[][] }> = [];
  let content = "";
  let headingPaths: string[][] = [];

  const flush = () => {
    if (!content.trim()) return;
    chunks.push({ content: content.trim(), headingPaths });
    content = "";
    headingPaths = [];
  };

  for (const section of document.sections) {
    const path = sectionPath(section);
    const sectionValue = `${path.join(" > ")}\n${section.text}`.trim();
    const pieces =
      sectionValue.length > maxCharacters
        ? splitLongSection(sectionValue, maxCharacters)
        : [sectionValue];

    for (const piece of pieces) {
      if (content && content.length + piece.length + 2 > targetCharacters) flush();
      content = content ? `${content}\n\n${piece}` : piece;
      headingPaths = [...headingPaths, path];
    }
  }

  flush();

  return chunks.map((chunk, chunkIndex) => {
    const uniqueHeadingPaths = chunk.headingPaths.filter(
      (path, index, values) =>
        values.findIndex((candidate) => candidate.join("\u0000") === path.join("\u0000")) === index,
    );
    const sections = [...new Set(uniqueHeadingPaths.map((path) => path.at(-1)).filter(Boolean))];
    return {
      chunkIndex,
      content: chunk.content,
      embeddingText: `${embeddingContext(document, uniqueHeadingPaths)}\n\nContent:\n${chunk.content}`,
      metadata: {
        ...document.metadata,
        chunkIndex,
        headingPath: uniqueHeadingPaths[0] ?? [],
        headingPaths: uniqueHeadingPaths,
        sanityDocumentId: document.sanityDocumentId,
        section: sections.join("; "),
        sourceType: document.sourceType,
        title: document.title,
        url: document.canonicalUrl,
      },
      tokenCount: approximateTokenCount(chunk.content),
    };
  });
}
