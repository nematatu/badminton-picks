import { env } from "cloudflare:workers";
import { z } from "zod";
import { pickSchema } from "./collection";

const rowSchema = z.object({
  id: z.string(), title: z.string(), authorName: z.string(), ownerHash: z.string(),
  revision: z.number().int(), createdAt: z.string(),
  items: z.string().transform((text) => JSON.parse(text)).pipe(z.array(pickSchema)),
});

export async function loadCollection(id: string) {
  const row = await env.DB.withSession("first-primary").prepare(
    `SELECT id, title, author_name AS authorName, owner_hash AS ownerHash,
      revision, created_at AS createdAt, items FROM collections WHERE id = ?`,
  ).bind(id).first();
  return row ? rowSchema.parse(row) : null;
}
