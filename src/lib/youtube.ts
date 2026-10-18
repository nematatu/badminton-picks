import { z } from "zod";
import { videoIdSchema } from "./collection";

/**
 * Extracts a YouTube video ID from various valid YouTube URL formats.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // If already an 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0]?.split("?")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2]?.split("?")[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2]?.split("?")[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith("/live/")) {
        const id = url.pathname.split("/")[2]?.split("?")[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export const youTubeMetaSchema = z.object({
  videoId: videoIdSchema,
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(120),
});
export type YouTubeMeta = z.infer<typeof youTubeMetaSchema>;
const oEmbedSchema = z.object({ title: z.string().min(1).max(300), author_name: z.string().min(1).max(120) });

export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
    signal: AbortSignal.timeout(6000), redirect: "manual",
  });
  if ([400, 401, 403, 404].includes(response.status)) return null;
  if (!response.ok) throw new Error("YouTube metadata unavailable");
  const text = await response.text();
  if (text.length > 65536) throw new Error("YouTube metadata too large");
  const data = oEmbedSchema.parse(JSON.parse(text));
  return { videoId, title: data.title, author: data.author_name };
}
