import { serve } from "@hono/node-server";

import app from "./app.js";

function getPort(value: string | undefined) {
  if (value === undefined) return 3000;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

const port = getPort(process.env.PORT);

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(
      JSON.stringify({
        level: "info",
        message: "server started",
        url: `http://localhost:${info.port}`,
      }),
    );
  },
);

let isShuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(JSON.stringify({ level: "info", message: "server stopping", signal }));
  server.close((error) => {
    if (error) {
      console.error(
        JSON.stringify({ level: "error", message: "server shutdown failed", error: error.message }),
      );
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
