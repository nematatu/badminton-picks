import { defineHandler, defineHead, type InferProps } from "void";
import { db, eq, and } from "void/db";
import { collections } from "@schema";
import { loadCollection } from "../../../src/lib/collection.server";
import { getOwnerHash } from "../../../src/lib/auth";
import { editSchema, readJson, revisionSchema } from "../../../src/lib/collection";

export type Props = InferProps<typeof loader>;
export const loader = defineHandler(async (c) => {
  c.header("Cache-Control", "private, no-store");
  const id = c.req.param("id");
  if (!id) return c.text("選集が見つかりません。", 404);
  const col = await loadCollection(id);
  if (!col) return c.text("選集が見つかりません。", 404);
  if (col.ownerHash !== await getOwnerHash(c)) return c.text("作成したブラウザからのみ編集できます。", 403);
  const { ownerHash, ...collection } = col;
  return { collection };
});
export const actions = {
  update: defineHandler(async (c) => {
    const ownerHash = await getOwnerHash(c);
    if (!ownerHash) return c.json({ error: "作成したブラウザから編集してください。" }, 403);
    const parsed = editSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success || parsed.data.id !== c.req.param("id"))
      return c.json({ error: "入力内容を確認してください。試合は1〜9件、メモは240字までです。" }, 422);
    const { id, revision, ...data } = parsed.data;
    const [updated] = await db.update(collections).set({
      ...data, revision: revision + 1, updatedAt: new Date().toISOString(),
    }).where(and(eq(collections.id, id), eq(collections.ownerHash, ownerHash),
      eq(collections.revision, revision))).returning({ id: collections.id });
    if (!updated) return c.json({ error: "別の画面で更新されたか、編集権限がありません。入力を控えてからページを開き直してください。" }, 409);
    return c.json({ location: `/c/${id}` });
  }),
  delete: defineHandler(async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "選集が見つかりません。" }, 404);
    const ownerHash = await getOwnerHash(c);
    if (!ownerHash) return c.json({ error: "作成したブラウザから削除してください。" }, 403);
    const parsed = revisionSchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return c.json({ error: "ページを開き直してから削除してください。" }, 422);
    const [deleted] = await db.delete(collections).where(and(
      eq(collections.id, id), eq(collections.ownerHash, ownerHash),
      eq(collections.revision, parsed.data.revision),
    )).returning({ id: collections.id });
    if (!deleted) return c.json({ error: "選集が更新されたか、削除権限がありません。ページを開き直してください。" }, 409);
    return c.json({ location: "/" });
  }),
};
export const head = defineHead(() => ({
  title: "選集を編集する | RALLY PICKS", meta: [{ name: "robots", content: "noindex" }],
}));
