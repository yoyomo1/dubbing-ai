import { createClient } from "@libsql/client";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";
import { allowlist, type AllowlistEntry, type AllowlistRole } from "@/lib/schema";

const client = createClient({
  url: env.tursoUrl,
  authToken: env.tursoAuthToken || undefined,
});

export const db = drizzle(client);

let schemaReady: Promise<void> | null = null;

function seededEmails() {
  return [
    ...new Set([
      ...env.ownerEmails,
      ...env.seedAllowlist,
    ]),
  ];
}

async function seedOwnerEntries() {
  const emails = seededEmails();

  await Promise.all(
    emails.map((email) =>
      client.execute({
        sql: "INSERT OR IGNORE INTO allowlist (email, role, created_at, created_by) VALUES (?, ?, ?, ?)",
        args: [
          email,
          env.ownerEmails.includes(email) ? "admin" : "member",
          new Date().toISOString(),
          "bootstrap",
        ],
      }),
    ),
  );
}

export async function ensureAllowlistSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS allowlist (
          email TEXT PRIMARY KEY,
          role TEXT NOT NULL DEFAULT 'member',
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL
        )
      `);
      await seedOwnerEntries();
    })();
  }

  await schemaReady;
}

export async function getAllowlistEntries() {
  await ensureAllowlistSchema();
  return db.select().from(allowlist).orderBy(desc(allowlist.createdAt));
}

export async function getAccessFlags(email?: string | null) {
  if (!email) {
    return { isAllowed: false, isAdmin: false };
  }

  const normalized = email.toLowerCase();

  await ensureAllowlistSchema();
  const [entry] = await db
    .select()
    .from(allowlist)
    .where(eq(allowlist.email, normalized))
    .limit(1);

  return {
    isAllowed: Boolean(entry),
    isAdmin: entry?.role === "admin" || env.ownerEmails.includes(normalized),
  };
}

export async function upsertAllowlistEntry(email: string, role: AllowlistRole, createdBy: string) {
  const normalized = email.toLowerCase().trim();
  await ensureAllowlistSchema();

  await client.execute({
    sql: `
      INSERT INTO allowlist (email, role, created_at, created_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        role=excluded.role,
        created_at=excluded.created_at,
        created_by=excluded.created_by
    `,
    args: [normalized, role, new Date().toISOString(), createdBy],
  });

  return normalized;
}

export async function deleteAllowlistEntry(email: string) {
  await ensureAllowlistSchema();
  await client.execute({
    sql: "DELETE FROM allowlist WHERE email = ?",
    args: [email.toLowerCase().trim()],
  });
}

export async function getAllowlistEntry(email: string): Promise<AllowlistEntry | null> {
  await ensureAllowlistSchema();

  const [entry] = await db
    .select()
    .from(allowlist)
    .where(eq(allowlist.email, email.toLowerCase().trim()))
    .limit(1);

  return entry ?? null;
}

