import { defineHandler, defineHead, type InferProps } from "void";
import { db } from "void/db";
import { collections, type PickItem } from "@schema";
import { getOrCreateOwnerHash } from "../src/lib/auth";
import { generateCollectionId } from "../src/lib/id";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  // Ensure owner cookie exists on the client
  await getOrCreateOwnerHash(c);
  const newId = generateCollectionId();
  return { newId };
});

export const action = defineHandler(async (c) => {
  const { hash } = await getOrCreateOwnerHash(c);
  const body = await c.req.json();

  const id = String(body.id || generateCollectionId()).trim();
  const title = String(body.title || "私を構成するバドミントンの試合").trim().slice(0, 100);
  const authorName = String(body.authorName || "匿名プレイヤー").trim().slice(0, 50);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (rawItems.length === 0) {
    return c.json({ error: "少なくとも1試合追加してください。" }, 400);
  }

  // Deduplicate and sanitize items
  const seenIds = new Set<string>();
  const items: PickItem[] = [];

  for (const it of rawItems) {
    const videoId = String(it.videoId || "").trim();
    if (!videoId || seenIds.has(videoId)) continue;
    seenIds.add(videoId);

    items.push({
      videoId,
      title: String(it.title || "YouTube Match").trim().slice(0, 120),
      author: String(it.author || "YouTube").trim().slice(0, 60),
      note: String(it.note || "").trim().slice(0, 280),
    });

    if (items.length >= 9) break;
  }

  if (items.length === 0) {
    return c.json({ error: "有効な試合動画がありません。" }, 400);
  }

  await db.insert(collections).values({
    id,
    title,
    authorName,
    items,
    ownerHash: hash,
    revision: 1,
  });

  return c.redirect(`/c/${id}`);
});

export const head = defineHead(() => {
  return {
    title: "好きな試合を選ぶ | RALLY PICKS",
    meta: [
      { name: "robots", content: "noindex" },
      { name: "description", content: "好きなバドミントンの試合をYouTubeから選んで選集カードを作ります。" },
    ],
  };
});
