// Admin: danh sách từ cấm (GET) & thêm từ (POST). Tự seed mặc định nếu còn trống.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listProfanityWords, addProfanityWord, seedProfanityWords, toProfanityRow } from "@/lib/profanity";

export async function GET() {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  let docs = await listProfanityWords();
  if (docs.length === 0) {
    await seedProfanityWords();
    docs = await listProfanityWords();
  }
  return NextResponse.json({ items: docs.map(toProfanityRow) });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g instanceof NextResponse) return g;
  const b = await req.json().catch(() => ({}));
  try {
    const created = await addProfanityWord({
      text: String(b.text ?? ""),
      accentInsensitive: !!b.accentInsensitive,
      enabled: b.enabled !== false,
      note: typeof b.note === "string" ? b.note : undefined,
    });
    return NextResponse.json({ ok: true, item: toProfanityRow(created) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không thêm được." }, { status: 400 });
  }
}
