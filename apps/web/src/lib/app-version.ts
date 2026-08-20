import appPackage from "../../package.json";

// The web package owns the deployed application's version. Importing this
// server-only module into the footer resolves the value at build time without
// exposing package.json to client-side code.
export const appVersion: string = appPackage.version;
