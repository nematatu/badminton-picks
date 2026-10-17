import { defineHandler, defineHead, type InferProps } from "void";
import { db, eq, and } from "void/db";
import { collections, type PickItem } from "@schema";
import { getOwnerHash } from "../../../src/lib/auth";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const id = c.req.param("id");
  if (!id) return c.text("Not found", 404);

  const [col] = await db.select().from(collections).where(eq(collections.id, id));
  if (!col) return c.text("Not found", 404);

  const ownerHash = await getOwnerHash(c);
  if (!ownerHash || col.ownerHash !== ownerHash) {
    return c.text("この選集の編集権限がありません（作成した端末・ブラウザからのみ編集できます）。", 403);
  }

  return {
    collection: {
      id: col.id,
      title: col.title,
      authorName: col.authorName,
      items: col.items || [],
    },
  };
});

export const actions = {
  // Update action: POST /c/[id]/edit?update
  update: defineHandler(async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Invalid ID" }, 400);

    const ownerHash = await getOwnerHash(c);
    if (!ownerHash) {
      return c.json({ error: "権限がありません" }, 403);
    }

    const [col] = await db.select().from(collections).where(eq(collections.id, id));
    if (!col || col.ownerHash !== ownerHash) {
      return c.json({ error: "権限がありません" }, 403);
    }

    const body = await c.req.json();
    const title = String(body.title || col.title).trim().slice(0, 100);
    const authorName = String(body.authorName || col.authorName).trim().slice(0, 50);
    const rawItems = Array.isArray(body.items) ? body.items : [];

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
      return c.json({ error: "少なくとも1試合追加してください。" }, 400);
    }

    await db
      .update(collections)
      .set({
        title,
        authorName,
        items,
        revision: col.revision + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(collections.id, id), eq(collections.ownerHash, ownerHash)));

    return c.redirect(`/c/${id}`);
  }),

  // Delete action: POST /c/[id]/edit?delete
  delete: defineHandler(async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Invalid ID" }, 400);

    const ownerHash = await getOwnerHash(c);
    if (!ownerHash) {
      return c.json({ error: "権限がありません" }, 403);
    }

    await db
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.ownerHash, ownerHash)));

    return c.redirect("/");
  }),
};

export const head = defineHead(() => {
  return {
    title: "選集を編集する | RALLY PICKS",
    meta: [{ name: "robots", content: "noindex" }],
  };
});
