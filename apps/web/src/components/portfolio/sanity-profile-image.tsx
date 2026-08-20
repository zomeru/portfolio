import Image from "next/image";

import { imageUrlFor } from "@/lib/sanity/image";
import type { Profile } from "@/lib/sanity/types";

type ProfilePhoto = NonNullable<Profile["photo"]>;

type SanityProfileImageProps = {
  value?: ProfilePhoto | null;
  size: number;
  priority?: boolean;
  className?: string;
};

export function SanityProfileImage({
  value,
  size,
  priority = false,
  className,
}: SanityProfileImageProps) {
  if (!value?.asset) {
    return (
      <Image
        src="/assets/zomer.jpg"
        alt="Zomer Gregorio"
        width={size}
        height={size}
        priority={priority}
        className={className}
      />
    );
  }

  const blurDataURL = value.asset.metadata?.lqip ?? undefined;

  return (
    <Image
      src={imageUrlFor(value).width(size).height(size).fit("crop").url()}
      alt={value.alt}
      width={size}
      height={size}
      priority={priority}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      className={className}
    />
  );
}
