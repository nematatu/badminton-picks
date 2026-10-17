import { defineHandler, defineHead, type InferProps } from "void";
import { db, desc, eq } from "void/db";
import { collections, type PickItem } from "@schema";
import { getOwnerHash } from "../src/lib/auth";

export interface CollectionSummary {
  id: string;
  title: string;
  authorName: string;
  items: PickItem[];
  itemCount: number;
  createdAt: string;
  isOwner: boolean;
}

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const ownerHash = await getOwnerHash(c);

  const rows = await db
    .select()
    .from(collections)
    .orderBy(desc(collections.createdAt))
    .limit(30);

  const myCollections: CollectionSummary[] = [];
  const recentCollections: CollectionSummary[] = [];

  for (const row of rows) {
    const isOwner = Boolean(ownerHash && row.ownerHash === ownerHash);
    const summary: CollectionSummary = {
      id: row.id,
      title: row.title,
      authorName: row.authorName,
      items: row.items || [],
      itemCount: (row.items || []).length,
      createdAt: row.createdAt,
      isOwner,
    };

    if (isOwner) {
      myCollections.push(summary);
    }
    recentCollections.push(summary);
  }

  return {
    myCollections,
    recentCollections,
  };
});

export const head = defineHead<Props>(() => {
  return {
    title: "RALLY PICKS - 私を構成するバドミントンの試合",
    meta: [
      {
        name: "description",
        content: "バドミントン好きの「私を構成する試合」が集まる場所。心に残る名試合・激闘のラリーをYouTubeから選んでシェアしよう。",
      },
      { property: "og:title", content: "RALLY PICKS - 私を構成するバドミントンの試合" },
      {
        property: "og:description",
        content: "バドミントン好きの「私を構成する試合」が集まる場所。心に残る名試合・激闘のラリーをYouTubeから選んでシェアしよう。",
      },
    ],
  };
});
