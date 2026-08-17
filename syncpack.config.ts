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
      pinVersion: "workspace:*",
    },
    {
      label: "Local workspace apps",
      dependencies: ["@portfolio/legacy-web", "@portfolio/legacy-api"],
      pinVersion: "workspace:*",
    },
  ],
};

export default config;
