import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const allowlist = sqliteTable("allowlist", {
  email: text("email").primaryKey(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});

export type AllowlistRole = typeof allowlist.$inferSelect.role;
export type AllowlistEntry = typeof allowlist.$inferSelect;

