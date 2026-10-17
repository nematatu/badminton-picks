import { defineHandler, defineHead, type InferProps } from "void";
import { db, eq } from "void/db";
import { collections, type PickItem } from "@schema";
import { getOwnerHash } from "../../src/lib/auth";

export interface CollectionDetail {
  id: string;
  title: string;
  authorName: string;
  items: PickItem[];
  createdAt: string;
  revision: number;
  isOwner: boolean;
}

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const id = c.req.param("id");
  if (!id) return c.text("Not found", 404);

  const [col] = await db.select().from(collections).where(eq(collections.id, id));
  if (!col) return c.text("Not found", 404);

  const ownerHash = await getOwnerHash(c);
  const isOwner = Boolean(ownerHash && col.ownerHash === ownerHash);

  const collection: CollectionDetail = {
    id: col.id,
    title: col.title,
    authorName: col.authorName,
    items: col.items || [],
    createdAt: col.createdAt,
    revision: col.revision,
    isOwner,
  };

  return { collection };
});

export const head = defineHead<Props>((c, props) => {
  if (!props?.collection) {
    return { title: "選集が見つかりません | RALLY PICKS" };
  }

  const { id, title, authorName, items, revision } = props.collection;
  const matchNames = items.map((it, idx) => `${idx + 1}. ${it.title}`).join(" / ");
  const desc = `選者: ${authorName} | 収録試合: ${matchNames}`.slice(0, 160);

  const url = new URL(c.req.url);
  const origin = url.origin;
  const ogImageUrl = `${origin}/og/${id}?v=${revision}`;
  const pageUrl = `${origin}/c/${id}`;

  return {
    title: `${title} - 選者: ${authorName} | RALLY PICKS`,
    meta: [
      { name: "description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: pageUrl },
      { property: "og:title", content: `${title} - 選者: ${authorName} | RALLY PICKS` },
      { property: "og:description", content: desc },
      { property: "og:image", content: ogImageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${title} - 選者: ${authorName}` },
      { name: "twitter:description", content: desc },
      { name: "twitter:image", content: ogImageUrl },
    ],
  };
});
