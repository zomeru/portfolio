import type { RcFile } from "syncpack";

const config: RcFile = {
  source: ["package.json", "{apps,packages}/*/package.json"],
  semverGroups: [
    {
      range: "",
      label: "exact",
      dependencies: ["turbo"],
    },
  ],
  versionGroups: [
    {
      label: "Local workspace packages",
      dependencies: ["@portfolio/*"],
      dependencyTypes: ["!local"],
      pinVersion: "workspace:*",
    },
    {
      label: "Local workspace apps",
      dependencies: ["@portfolio/legacy-web", "@portfolio/legacy-api"],
      dependencyTypes: ["!local"],
      pinVersion: "workspace:*",
    },
    {
      label: "TypeScript (latest 6.x, <7)",
      dependencies: ["typescript"],
      pinVersion: "^6.0.3",
    },
  ],
};

export default config;
