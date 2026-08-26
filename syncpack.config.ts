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
      label: "TypeScript 6 compatibility API",
      dependencies: ["typescript"],
      packages: ["!@portfolio/web"],
      pinVersion: "npm:@typescript/typescript6@^6.0.2",
    },
    {
      label: "TypeScript 7 compiler for Next.js",
      dependencies: ["typescript"],
      packages: ["@portfolio/web"],
      pinVersion: "^7.0.2",
    },
  ],
};

export default config;
