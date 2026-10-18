import { defineHandler, defineHead, type InferProps } from "void";
import { db, desc, eq, ne } from "void/db";
import { collections } from "@schema";
import { getOwnerHash } from "../src/lib/auth";

export type CollectionSummary = Pick<typeof collections.$inferSelect, "id" | "title" | "authorName" | "items">;
const summarize = ({ id, title, authorName, items }: typeof collections.$inferSelect): CollectionSummary =>
  ({ id, title, authorName, items });

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  c.header("Cache-Control", "private, no-store");
  const ownerHash = await getOwnerHash(c);

  const rows = await db
    .select()
    .from(collections)
    .where(ne(collections.ownerHash, "seed-owner-hash"))
    .orderBy(desc(collections.createdAt))
    .limit(30);

  const ownRows = ownerHash ? await db.select().from(collections)
    .where(eq(collections.ownerHash, ownerHash)).orderBy(desc(collections.createdAt)).limit(30) : [];
  return { myCollections: ownRows.map(summarize), recentCollections: rows.map(summarize) };
});

export const head = defineHead<Props>(() => {
  return {
    title: "RALLY PICKS - 私を構成するバドミントンの試合",
    meta: [
      {
        name: "description",
        content: "YouTubeから好きなバドミントンの試合を選び、ひとこと添えて共有できます。",
      },
      { property: "og:title", content: "RALLY PICKS - 私を構成するバドミントンの試合" },
      {
        property: "og:description",
        content: "YouTubeから好きなバドミントンの試合を選び、ひとこと添えて共有できます。",
      },
    ],
  };
});
