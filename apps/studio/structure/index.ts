import type { StructureResolver } from "sanity/structure";

const documentTypes = ["experience", "project", "blogPost", "techStack"] as const;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Portfolio")
    .items([
      S.listItem()
        .title("Profile")
        .id("profile")
        .child(S.document().schemaType("profile").documentId("profile").title("Profile")),
      S.divider(),
      ...documentTypes.map((type) => S.documentTypeListItem(type)),
    ]);
