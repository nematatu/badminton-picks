import { defineHandler, defineHead, type InferProps } from "void";
import { db, eq } from "void/db";
import { collections } from "@schema";
import { getOrCreateOwnerHash } from "../src/lib/auth";
import { generateCollectionId } from "../src/lib/id";
import { collectionSchema, readJson } from "../src/lib/collection";

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  c.header("Cache-Control", "private, no-store");
  await getOrCreateOwnerHash(c);
  const newId = generateCollectionId();
  return { newId };
});

export const action = defineHandler(async (c) => {
  const parsed = collectionSchema.safeParse(await readJson(c.req.raw));
  if (!parsed.success) return c.json({ error: "入力内容を確認してください。タイトルは80字、名前は40字、メモは240字までです。" }, 422);
  const { hash } = await getOrCreateOwnerHash(c);
  const { id, ...data } = parsed.data;
  const [created] = await db.insert(collections).values({
    id, ...data,
    ownerHash: hash,
    revision: 1,
  }).onConflictDoNothing().returning({ id: collections.id });
  if (!created) {
    const [existing] = await db.select({ ownerHash: collections.ownerHash })
      .from(collections).where(eq(collections.id, id));
    if (existing?.ownerHash !== hash) return c.json({ error: "このURLはすでに使われています。新しい選集を開き直してください。" }, 409);
  }
  return c.json({ location: `/c/${id}` });
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
