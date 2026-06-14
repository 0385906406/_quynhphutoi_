// Rate-limit dùng chung — lưu đếm theo cửa sổ cố định trong MongoDB (TTL tự xoá).
// Hoạt động cả khi deploy nhiều instance/serverless (khác với bộ đếm in-memory).
import { getDb } from "@/lib/db";

let _indexed = false;
async function col() {
  const db = await getDb();
  const c = db.collection<{ _id: string; count: number; expireAt: Date }>("rate_limits");
  if (!_indexed) {
    await c.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
    _indexed = true;
  }
  return c;
}

export type RateResult = { ok: boolean; retryAfter: number };

// max lượt trong windowSec giây cho mỗi `key`. Trả ok=false + retryAfter (giây) khi vượt.
export async function rateLimit(key: string, max: number, windowSec: number): Promise<RateResult> {
  try {
    const now = Date.now();
    const winMs = windowSec * 1000;
    const start = Math.floor(now / winMs) * winMs;
    const id = `${key}:${start}`;
    const c = await col();
    const doc = await c.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(start + winMs) } },
      { upsert: true, returnDocument: "after" },
    );
    const count = doc?.count ?? 1;
    if (count > max) return { ok: false, retryAfter: Math.max(1, Math.ceil((start + winMs - now) / 1000)) };
    return { ok: true, retryAfter: 0 };
  } catch {
    // Lỗi DB → không chặn người dùng hợp lệ (fail-open).
    return { ok: true, retryAfter: 0 };
  }
}

// IP client từ header proxy (Vercel/Nginx) — dùng cho throttle đăng nhập/đăng ký.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Tiện ích: trả response 429 chuẩn.
export function tooMany(retryAfter: number, message = "Bạn thao tác quá nhanh, vui lòng thử lại sau.") {
  return Response.json({ error: message, retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}
