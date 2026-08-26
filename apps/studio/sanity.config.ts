import { visionTool } from "@sanity/vision";
import { defineConfig, type WorkspaceOptions } from "sanity";
import { structureTool } from "sanity/structure";

import { studioConfig } from "./config";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

type SharedConfig = Omit<WorkspaceOptions, "name" | "basePath" | "dataset">;

const sharedConfig: SharedConfig = {
  projectId: studioConfig.projectId,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previousActions, context) =>
      context.schemaType === "profile"
        ? previousActions.filter(({ action }) => action !== "duplicate" && action !== "delete")
        : previousActions,
    newDocumentOptions: (previousOptions) =>
      previousOptions.filter(({ templateId }) => templateId !== "profile"),
  },
};

const studioWorkspaces: WorkspaceOptions[] = [
  {
    name: "production",
    title: "Portfolio CMS (Production)",
    subtitle: "Production content",
    basePath: "/production",
    dataset: studioConfig.datasetMap.production,
    ...sharedConfig,
  },
  {
    name: "development",
    title: "Portfolio CMS (Development)",
    subtitle: "Development content",
    basePath: "/development",
    dataset: studioConfig.datasetMap.development,
    ...sharedConfig,
  },
];

export default defineConfig(studioWorkspaces);
