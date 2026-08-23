import type { KnowledgeChunkInput, NormalizedKnowledgeDocument } from "./types";

const TARGET_CHUNK_CHARACTERS = 3_600;
const MAX_CHUNK_CHARACTERS = 4_800;

function approximateTokenCount(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function splitLongSection(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const groups: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > MAX_CHUNK_CHARACTERS) {
      groups.push(current);
      current = "";
    }

    if (paragraph.length > MAX_CHUNK_CHARACTERS) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (current && current.length + sentence.length + 1 > MAX_CHUNK_CHARACTERS) {
          groups.push(current);
          current = "";
        }
        current = current ? `${current} ${sentence}` : sentence;
      }
      continue;
    }

    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }

  if (current) groups.push(current);
  return groups;
}

export function chunkKnowledgeDocument(
  document: NormalizedKnowledgeDocument,
): KnowledgeChunkInput[] {
  const chunks: Array<{ content: string; headings: string[] }> = [];
  let content = "";
  let headings: string[] = [];

  const flush = () => {
    if (!content.trim()) return;
    chunks.push({ content: content.trim(), headings });
    content = "";
    headings = [];
  };

  for (const section of document.sections) {
    const sectionValue = `${section.heading}\n${section.text}`.trim();
    const pieces =
      sectionValue.length > MAX_CHUNK_CHARACTERS ? splitLongSection(sectionValue) : [sectionValue];

    for (const piece of pieces) {
      if (content && content.length + piece.length + 2 > TARGET_CHUNK_CHARACTERS) flush();
      content = content ? `${content}\n\n${piece}` : piece;
      headings = [...headings, section.heading];
    }
  }

  flush();

  return chunks.map((chunk, chunkIndex) => ({
    chunkIndex,
    content: chunk.content,
    metadata: {
      ...document.metadata,
      headings: [...new Set(chunk.headings)],
      sanityDocumentId: document.sanityDocumentId,
      sourceType: document.sourceType,
      title: document.title,
      url: document.canonicalUrl,
    },
    tokenCount: approximateTokenCount(chunk.content),
  }));
}
