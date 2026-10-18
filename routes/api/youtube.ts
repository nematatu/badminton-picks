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

  let meta;
  try { meta = await fetchYouTubeMeta(videoId); }
  catch { return c.json({ error: "YouTubeに接続できませんでした。少し待ってからお試しください。" }, 502); }
  if (!meta) {
    return c.json({ error: "この動画は取得できません。公開状態やURLをご確認ください" }, 404);
  }

  return c.json(meta);
});
