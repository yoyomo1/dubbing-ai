import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { deleteAllowlistEntry, getAllowlistEntries, upsertAllowlistEntry } from "@/lib/db";

const bodySchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "member"]).optional(),
});

async function requireAdmin() {
  const session = await getServerAuthSession();

  if (!session?.user?.isAdmin) {
    return null;
  }

  return session.user.email;
}

export async function GET() {
  const adminEmail = await requireAdmin();

  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await getAllowlistEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const adminEmail = await requireAdmin();

  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = bodySchema.parse(await request.json());
  await upsertAllowlistEntry(payload.email, payload.role ?? "member", adminEmail);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const adminEmail = await requireAdmin();

  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = bodySchema.pick({ email: true }).parse(await request.json());
  await deleteAllowlistEntry(payload.email);

  return NextResponse.json({ ok: true });
}

