// Tìm kiếm toàn cục: GET /api/search?q=...
// Chống DoS: giới hạn độ dài query + rate-limit theo IP (đủ rộng cho gõ typeahead).
import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const EMPTY = { total: 0, groups: [] };

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json(EMPTY);

  const rl = await rateLimit(`search:${clientIp(req)}`, 40, 60);
  if (!rl.ok) return NextResponse.json(EMPTY); // vượt ngưỡng → trả rỗng, không phá ô tìm kiếm

  const result = await searchAll(q, 6);
  return NextResponse.json(result);
}
