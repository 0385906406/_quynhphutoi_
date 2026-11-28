// Gợi ý bài theo sở thích: POST /api/recommend { signals, exclude, limit }.
// Không đọc/ghi dữ liệu cá nhân; chỉ chấm điểm bài công khai theo tín hiệu ẩn danh do trình duyệt gửi.
import { NextResponse } from "next/server";
import { recommend, profileSignals, type RecSignals } from "@/lib/recommend";
import { getSession } from "@/lib/auth";
import { findById } from "@/lib/users";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const pairs = (v: unknown, max: number): [string, number][] =>
  Array.isArray(v)
    ? v.slice(0, max).flatMap((x) => (Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number" ? [[x[0].normalize("NFC").toLowerCase().slice(0, 40), Math.min(50, Math.max(0, x[1]))] as [string, number]] : []))
    : [];
const strs = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.slice(0, max).filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)) : [];

export async function POST(req: Request) {
  const rl = await rateLimit(`rec:${clientIp(req)}`, 40, 60);
  if (!rl.ok) return NextResponse.json({ items: [], personalized: false });
  const body = (await req.json().catch(() => null)) as { signals?: Record<string, unknown>; exclude?: unknown; limit?: unknown; scope?: unknown } | null;
  const s = body?.signals ?? {};
  const sig: RecSignals = { cats: pairs(s.cats, 8), tags: pairs(s.tags, 14), words: pairs(s.words, 16), read: strs(s.read, 100) };
  // Người đã đăng nhập + đồng ý: cộng thêm tín hiệu từ hồ sơ (chủ đề quan tâm, nơi ở, nghề, độ tuổi).
  const session = await getSession().catch(() => null);
  if (session?.id) {
    const u = await findById(session.id).catch(() => null);
    const ps = profileSignals(u?.profile);
    sig.cats.push(...ps.cats); sig.words.push(...ps.words);
  }
  const limit = typeof body?.limit === "number" ? body.limit : 6;
  const scope = body?.scope === "ngoai-xa" ? "ngoai-xa" : body?.scope === "trong-xa" ? "trong-xa" : undefined;
  const data = await recommend(sig, { limit, exclude: strs(body?.exclude, 30), scope }).catch(() => ({ items: [], personalized: false }));
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
