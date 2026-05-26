import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #070303 0%, #0d1119 50%, #1a1520 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo M */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 22,
            background: "#070303",
            border: "2px solid rgba(169,111,87,0.4)",
            marginBottom: 32,
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 64 64"
          >
            <path
              d="M14 44V20h7.2l10.5 13.4L42.2 20H50v24h-7.3V31.1l-8.4 10.4h-5.1l-8.4-10.4V44H14Z"
              fill="#f7f4ef"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f7f4ef",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          MojFlow
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#a96f57",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
          }}
        >
          Web &bull; Mobile &bull; AI &bull; Cyber Security
        </div>

        {/* Subtle gradient line */}
        <div
          style={{
            width: 200,
            height: 2,
            marginTop: 32,
            background: "linear-gradient(90deg, transparent, #a96f57, transparent)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
