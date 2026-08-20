import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { studioConfig } from "./config";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

export default defineConfig({
  name: "default",
  title: "Portfolio CMS",

  projectId: studioConfig.projectId,
  dataset: studioConfig.dataset,

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
});
