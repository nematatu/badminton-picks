import { sql } from "void/db";
import { integer, sqliteTable, text, index } from "void/schema-d1";

export interface PickItem {
  videoId: string;
  title: string;
  author: string;
  note?: string;
  slot?: number;
}

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    authorName: text("author_name").notNull(),
    items: text("items", { mode: "json" }).$type<PickItem[]>().notNull(),
    ownerHash: text("owner_hash").notNull(),
    revision: integer("revision").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index("collections_created_at_idx").on(table.createdAt),
  ],
);
