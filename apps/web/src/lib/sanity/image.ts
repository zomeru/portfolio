import { getSanityEnv } from "@portfolio/env/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import { createImageUrlBuilder } from "@sanity/image-url";

const sanityEnv = getSanityEnv();
const imageBuilder = createImageUrlBuilder({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
});

export function imageUrlFor(source: SanityImageSource) {
  return imageBuilder.image(source).auto("format");
}
