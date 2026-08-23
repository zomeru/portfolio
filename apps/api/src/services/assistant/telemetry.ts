import { type Attributes, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("ask-zomer-ai");

export function withAssistantSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
) {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await operation();
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
