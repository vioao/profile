import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { profile } from "@/data/profile";

async function getImageBase64(avatarUrl?: string): Promise<string | null> {
  if (!avatarUrl) return null;
  let avatarBase64: string | null = null;
  try {
    if (avatarUrl) {
      if (avatarUrl.startsWith("http")) {
        const url = new URL(avatarUrl);
        // If it's localhost, try to resolve locally to avoid server dependency
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          const localPath = join(process.cwd(), "public", url.pathname);
          const avatarBuffer = await readFile(localPath);
          avatarBase64 = `data:image/png;base64,${avatarBuffer.toString(
            "base64"
          )}`;
        } else {
          // It's a remote URL (third party)
          console.log(`Fetching avatar from ${avatarUrl}...`);
          const response = await fetch(avatarUrl);
          if (!response.ok)
            throw new Error(`Failed to fetch avatar: ${response.statusText}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType =
            response.headers.get("content-type") || "image/png";
          avatarBase64 = `data:${contentType};base64,${buffer.toString(
            "base64"
          )}`;
        }
      } else {
        // It's a local path, e.g. "/avatar.png"
        const localPath = join(
          process.cwd(),
          "public",
          avatarUrl.startsWith("/") ? avatarUrl.slice(1) : avatarUrl
        );
        const avatarBuffer = await readFile(localPath);
        avatarBase64 = `data:image/png;base64,${avatarBuffer.toString(
          "base64"
        )}`;
      }
    }
  } catch (e) {
    console.warn(`Could not load avatar from ${avatarUrl}. Error: ${e}`);
  }
  return avatarBase64;
}

async function generateOgImage() {
  console.log("Generating OpenGraph image...");

  // Load font
  // Using a reliable CDN for the font file
  const fontData = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf"
  ).then((res) => res.arrayBuffer());

  // Load avatar
  const avatarBase64 = await getImageBase64(profile.person.avatar);

  const initials = profile.person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const skills = Array.isArray(profile.skills)
    ? profile.skills.slice(0, 5)
    : [];

  const svg = await satori(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)",
        backgroundSize: "100px 100px",
        position: "relative",
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 50%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          padding: "80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Avatar */}
        {avatarBase64 ? (
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid rgba(99, 102, 241, 0.5)",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
              display: "flex",
            }}
          >
            <img
              src={avatarBase64}
              alt={profile.person.name}
              width={150}
              height={150}
              style={{
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              border: "4px solid rgba(99, 102, 241, 0.5)",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              fontSize: "60px",
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            {initials}
          </div>
        )}

        {/* Name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: "-0.025em",
          }}
        >
          {profile.person.name}
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "36px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "900px",
            fontWeight: "500",
          }}
        >
          {profile.person.headline}
        </div>

        {/* Location */}
        {profile.person.location && (
          <div
            style={{
              fontSize: "24px",
              color: "#71717a",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.person.location}
          </div>
        )}

        {/* Top Skills - Display first 5 */}
        {skills.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              justifyContent: "center",
              maxWidth: "1000px",
              marginTop: "24px",
            }}
          >
            {skills.map((skill) => (
              <div
                key={skill.text}
                style={{
                  padding: "12px 24px",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "8px",
                  color: "#a5b4fc",
                  fontSize: "20px",
                  fontWeight: "500",
                }}
              >
                {skill.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1)",
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  await writeFile(
    join(process.cwd(), "public", "opengraph-image.png"),
    pngBuffer
  );
  console.log("OpenGraph image generated at public/opengraph-image.png");
}

generateOgImage().catch((err) => {
  console.error("Failed to generate OG image:", err);
  process.exit(1);
});
