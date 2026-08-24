import type { TextStreamPart, ToolSet } from "ai";

const LINE_CITATION_PATTERN =
  /【[ \t]{0,3}(\d{1,4})[ \t]{0,3}†[ \t]{0,3}L\d{1,6}(?:[ \t]{0,3}-[ \t]{0,3}L?\d{1,6})?[ \t]{0,3}】/g;
const SIMPLE_CITATION_PATTERN = /【[ \t]{0,3}(\d{1,4})[ \t]{0,3}】/g;
const STREAM_TAIL_CHARACTERS = 48;

export function normalizeAssistantCitations(
  content: string,
  sourceCount = Number.POSITIVE_INFINITY,
) {
  const replaceCitation = (_marker: string, sourceNumber: string) => {
    const parsedSourceNumber = Number(sourceNumber);
    return parsedSourceNumber >= 1 && parsedSourceNumber <= sourceCount
      ? `[${parsedSourceNumber}]`
      : "";
  };
  return content
    .replace(LINE_CITATION_PATTERN, replaceCitation)
    .replace(SIMPLE_CITATION_PATTERN, replaceCitation);
}

function safeTailStart(content: string) {
  let tailStart = Math.max(0, content.length - STREAM_TAIL_CHARACTERS);
  const previousCodeUnit = content.charCodeAt(tailStart - 1);
  const nextCodeUnit = content.charCodeAt(tailStart);
  if (
    previousCodeUnit >= 0xd800 &&
    previousCodeUnit <= 0xdbff &&
    nextCodeUnit >= 0xdc00 &&
    nextCodeUnit <= 0xdfff
  ) {
    tailStart -= 1;
  }
  return tailStart;
}

export function normalizeCitationStream<TOOLS extends ToolSet>(sourceCount: number) {
  return () => {
    const pendingText = new Map<string, string>();

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          const normalized = normalizeAssistantCitations(
            `${pendingText.get(chunk.id) ?? ""}${chunk.text}`,
            sourceCount,
          );
          const tailStart = safeTailStart(normalized);
          const ready = normalized.slice(0, tailStart);
          pendingText.set(chunk.id, normalized.slice(tailStart));
          if (ready) controller.enqueue({ ...chunk, text: ready });
          return;
        }

        if (chunk.type === "text-end") {
          const pending = pendingText.get(chunk.id);
          if (pending) {
            controller.enqueue({ type: "text-delta", id: chunk.id, text: pending });
            pendingText.delete(chunk.id);
          }
        }

        controller.enqueue(chunk);
      },
      flush(controller) {
        for (const [id, pending] of pendingText) {
          if (pending) controller.enqueue({ type: "text-delta", id, text: pending });
        }
      },
    });
  };
}
