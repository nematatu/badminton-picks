import { z } from "zod";
import { BOARD_SIZE } from "./board";

export const MAX_PICKS = BOARD_SIZE;
export const videoIdSchema = z.string().regex(/^[\w-]{11}$/);
export const pickSchema = z.object({
  videoId: videoIdSchema,
  slot: z.number().int().min(0).max(BOARD_SIZE - 1).optional(),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(120),
  note: z.string().trim().max(240).default(""),
});
export const collectionSchema = z.object({
  id: z.string().regex(/^[\w-]{8,64}$/),
  title: z.string().trim().min(1, "選集のタイトルを入力してください。").max(80),
  authorName: z.string().trim().max(40).transform((name) => name || "匿名"),
  items: z.array(pickSchema).min(1, "試合を1つ以上追加してください。").max(MAX_PICKS)
    .refine((items) => new Set(items.map((item) => item.videoId)).size === items.length,
      "同じ試合が重複しています。")
    .refine((items) => new Set(items.map((item, index) => item.slot ?? index)).size === items.length,
      "試合の位置が重複しています。"),
});
export const editSchema = collectionSchema.extend({ revision: z.number().int().positive() });
export const revisionSchema = z.object({ revision: z.number().int().positive() });
export const resultSchema = z.object({ location: z.string().startsWith("/") });
export const errorSchema = z.object({ error: z.string() });

export async function readJson(request: Request): Promise<unknown> {
  const body = await request.text();
  if (body.length > 20_000) return null;
  try { return JSON.parse(body); } catch { return null; }
}
