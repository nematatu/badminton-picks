import { defineHandler } from "void";
import { extractYouTubeVideoId, fetchYouTubeMeta } from "../../src/lib/youtube";

export const GET = defineHandler(async (c) => {
  const urlParam = c.req.query("url");
  if (!urlParam) {
    return c.json({ error: "URLが指定されていません" }, 400);
  }

  const videoId = extractYouTubeVideoId(urlParam);
  if (!videoId) {
    return c.json({ error: "有効なYouTubeの動画URLではありません" }, 400);
  }

  const meta = await fetchYouTubeMeta(videoId);
  if (!meta) {
    return c.json({ error: "動画情報を取得できませんでした" }, 404);
  }

  return c.json(meta);
});
