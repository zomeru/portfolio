import type { PublicPhoto } from "@portfolio/api/public-portfolio";

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
  const source = value ? new URL(value.url) : null;
  const widths = [size, size * 2, size * 3];
  function imageUrl(width: number) {
    const url = new URL(source!);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(width));
    url.searchParams.set("fit", "crop");
    url.searchParams.set("auto", "format");
    return url.href;
  }

  return (
    <img
      src={source ? imageUrl(size) : "/assets/zomer.jpg"}
      srcSet={source ? widths.map((width) => `${imageUrl(width)} ${width}w`).join(", ") : undefined}
      alt={value?.alt ?? "Zomer Gregorio"}
      width={size}
      height={size}
      sizes={`${size}px`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
