import { defineCliConfig } from "sanity/cli";
import { studioConfig } from "./config";

export default defineCliConfig({
  api: {
    projectId: studioConfig.projectId,
    dataset: studioConfig.dataset,
  },
  deployment: {
    appId: studioConfig.appId,
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    path: "../web/src/**/*.{ts,tsx}",
    schema: "schema.json",
    generates: "../web/src/lib/sanity/sanity.types.ts",
    overloadClientMethods: true,
  },
});
