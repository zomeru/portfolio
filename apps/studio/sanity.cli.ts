import { defineCliConfig } from "sanity/cli";
import { studioConfig } from "./config";

export default defineCliConfig({
  api: {
    projectId: studioConfig.projectId,
    dataset: studioConfig.dataset,
  },
  ...(studioConfig.appId ? { deployment: { appId: studioConfig.appId, autoUpdates: true } } : {}),
});
