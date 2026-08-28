import type { PublicPhoto } from "@portfolio/api/public-portfolio";
import Image from "next/image";

type PublicProfileImageProps = {
  value?: PublicPhoto | null;
  size: number;
  priority?: boolean;
  className?: string;
};

export function PublicProfileImage({
  value,
  size,
  priority = false,
  className,
}: PublicProfileImageProps) {
  if (!value) {
    return (
      <Image
        src="/assets/zomer.jpg"
        alt="Zomer Gregorio"
        width={size}
        height={size}
        sizes="96px"
        priority={priority}
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <Image
      src={value.url}
      alt={value.alt}
      width={value.width ?? size}
      height={value.height ?? size}
      sizes="96px"
      priority={priority}
      {...(value.lqip ? { placeholder: "blur" as const, blurDataURL: value.lqip } : {})}
      {...(className ? { className } : {})}
    />
  );
}
