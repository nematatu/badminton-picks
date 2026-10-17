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

export interface YouTubeMeta {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  isCustomTitle?: boolean;
}

/**
 * Fetches video metadata via YouTube's official oEmbed endpoint.
 */
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "BadmintonPicks/1.0" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      return {
        videoId,
        title: data.title || "YouTube Match",
        author: data.author_name || "YouTube",
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch {
    clearTimeout(timeoutId);
  }

  // Graceful fallback for videos where oEmbed fails or restrictions apply
  return {
    videoId,
    title: `YouTube 試合動画 (${videoId})`,
    author: "YouTube",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    isCustomTitle: true,
  };
}
