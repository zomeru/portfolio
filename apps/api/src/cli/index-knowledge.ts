import { logError } from "../lib/log";
import {
  IngestionAlreadyRunningError,
  synchronizePortfolioKnowledge,
} from "../services/assistant/ingestion";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

function createProgressReporter() {
  const interactive = Boolean(process.stderr.isTTY && !process.env.CI);
  const startedAt = Date.now();
  let frameIndex = 0;
  let message = "Starting portfolio indexing…";
  let lastOutputAt = startedAt;

  const render = () => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    frameIndex += 1;
    process.stderr.write(`\r\u001b[2K${frame} ${message}`);
  };

  if (interactive) render();
  else console.log(`→ ${message}`);

  const timer = interactive ? setInterval(render, 80) : undefined;
  const heartbeat = interactive
    ? undefined
    : setInterval(() => {
        if (Date.now() - lastOutputAt < 15_000) return;
        const elapsedSeconds = Math.round((Date.now() - startedAt) / 1_000);
        console.log(`… Still working: ${message} (${elapsedSeconds}s elapsed)`);
        lastOutputAt = Date.now();
      }, 1_000);
  heartbeat?.unref();

  return {
    update(nextMessage: string) {
      message = nextMessage
        .replace(/\p{Cc}/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (interactive) render();
      else {
        console.log(`→ ${message}`);
        lastOutputAt = Date.now();
      }
    },
    stop(finalMessage: string, failed = false) {
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
      if (interactive) process.stderr.write("\r\u001b[2K");
      const elapsedSeconds = ((Date.now() - startedAt) / 1_000).toFixed(1);
      console.log(`${failed ? "×" : "✓"} ${finalMessage} (${elapsedSeconds}s)`);
    },
  };
}

const supportedArguments = new Set(["--force"]);
const argumentsList = process.argv.slice(2);
const unsupported = argumentsList.find((argument) => !supportedArguments.has(argument));

if (unsupported) {
  console.error(`Unknown option: ${unsupported}`);
  process.exitCode = 1;
} else {
  const progress = createProgressReporter();
  try {
    const summary = await synchronizePortfolioKnowledge({
      trigger: "cli",
      force: argumentsList.includes("--force"),
      onProgress: progress.update,
    });
    progress.stop("Portfolio indexing complete.");
    console.log(`Documents scanned: ${summary.documentsSeen}`);
    console.log(`Created: ${summary.documentsCreated}`);
    console.log(`Updated: ${summary.documentsUpdated}`);
    console.log(`Unchanged: ${summary.documentsUnchanged}`);
    console.log(`Deleted: ${summary.documentsDeleted}`);
    console.log(`Chunks embedded: ${summary.chunksCreated}`);
  } catch (error) {
    progress.stop("Portfolio indexing stopped.", true);
    logError("portfolio indexing CLI failed", error, {
      operation: "assistant.indexKnowledgeCli",
      force: argumentsList.includes("--force"),
    });
    console.error(
      error instanceof IngestionAlreadyRunningError
        ? error.message
        : "Portfolio indexing failed. Inspect server logs and the ingestion_runs record.",
    );
    process.exitCode = 1;
  }
}
