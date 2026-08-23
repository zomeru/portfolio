import "server-only";

import { ImageResponse } from "next/og";

type PortfolioOgImageOptions = {
  description: string;
  eyebrow: string;
  footer?: string;
  index: string;
  title: string;
};

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function createPortfolioOgImage(options: PortfolioOgImageOptions) {
  const titleSize = options.title.length > 72 ? 54 : options.title.length > 44 ? 62 : 72;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#fafafa",
        color: "#0a0a0a",
        fontFamily: "sans-serif",
        padding: "52px 58px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: "radial-gradient(circle, rgba(10, 10, 10, 0.16) 1px, transparent 1.5px)",
          backgroundSize: "22px 22px",
          opacity: 0.24,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "28px",
          display: "flex",
          border: "1px solid #e4e4e7",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            minWidth: 0,
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "monospace",
            fontSize: 20,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <span>{options.index}</span>
            <span style={{ color: "#71717a" }}>/</span>
            <span style={{ color: "#52525b" }}>{options.eyebrow}</span>
          </div>
          <span style={{ color: "#52525b", letterSpacing: "0.08em" }}>Zomer Gregorio</span>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            minWidth: 0,
            flexDirection: "column",
            maxWidth: 980,
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              minWidth: 0,
              fontSize: titleSize,
              fontWeight: 600,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
            }}
          >
            {options.title}
          </div>
          <div
            style={{
              display: "flex",
              minWidth: 0,
              maxWidth: 850,
              color: "#52525b",
              fontSize: 27,
              lineHeight: 1.4,
            }}
          >
            {options.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            minWidth: 0,
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #e4e4e7",
            paddingTop: 18,
            color: "#52525b",
            fontFamily: "monospace",
            fontSize: 18,
          }}
        >
          <span>{options.footer ?? "zomer.dev"}</span>
          <span style={{ color: "#a1a1aa" }}>Portfolio / {new Date().getUTCFullYear()}</span>
        </div>
      </div>
    </div>,
    OG_IMAGE_SIZE,
  );
}
