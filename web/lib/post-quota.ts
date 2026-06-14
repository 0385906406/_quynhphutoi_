// Hạn mức đăng tin theo người dùng (lưu DB, dùng chung mọi module: việc làm/tìm đồ rơi/mua bán).
//   - Tối đa POST_DAILY_MAX tin/ngày (theo ngày giờ Việt Nam).
//   - Mỗi tin cách nhau tối thiểu cooldown; ĐĂNG LIÊN TỤC → cooldown tăng dần (10 → 20 → 30 … phút).
//   - Nếu nghỉ đủ lâu (> RESET) thì hết "chuỗi liên tục", cooldown về mức cơ bản.
import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";

const RESET_MS = 2 * 60 * 60 * 1000; // nghỉ > 2 giờ → reset chuỗi
const VN_OFFSET = 7 * 60 * 60 * 1000; // UTC+7

type QuotaDoc = { _id: string; day: string; count: number; lastPostAt: Date; streak: number };

const vnDay = (t: number) => new Date(t + VN_OFFSET).toISOString().slice(0, 10);
const requiredMin = (streak: number, baseMin: number, maxMin: number) => Math.min(baseMin * (streak + 1), maxMin);

async function col() {
  const db = await getDb();
  return db.collection<QuotaDoc>("post_quota");
}

export type QuotaResult = { ok: true } | { ok: false; message: string };

// Kiểm tra trước khi đăng (KHÔNG ghi). Gọi recordPost sau khi đăng thành công.
export async function checkPostQuota(userId: string): Promise<QuotaResult> {
  const [c, s] = await Promise.all([col(), getSettings()]);
  const doc = await c.findOne({ _id: userId });
  const now = Date.now();
  const today = vnDay(now);

  const countToday = doc && doc.day === today ? doc.count : 0;
  if (countToday >= s.postDailyMax) {
    return { ok: false, message: `Bạn đã đăng tối đa ${s.postDailyMax} tin trong ngày. Vui lòng quay lại vào ngày mai.` };
  }
  if (doc?.lastPostAt) {
    const elapsed = now - new Date(doc.lastPostAt).getTime();
    const needMs = requiredMin(doc.streak ?? 0, s.postCooldownMin, s.postCooldownMax) * 60_000;
    if (elapsed < needMs) {
      const waitMin = Math.ceil((needMs - elapsed) / 60_000);
      return { ok: false, message: `Bạn đăng tin quá nhanh. Vui lòng đợi khoảng ${waitMin} phút rồi đăng tiếp.` };
    }
  }
  return { ok: true };
}

// Ghi nhận 1 lần đăng thành công: tăng số đếm ngày + cập nhật chuỗi liên tục.
export async function recordPost(userId: string): Promise<void> {
  const c = await col();
  const now = new Date();
  const today = vnDay(now.getTime());
  const doc = await c.findOne({ _id: userId });

  let count = 1;
  let streak = 0;
  if (doc) {
    count = doc.day === today ? doc.count + 1 : 1;
    const elapsed = doc.lastPostAt ? now.getTime() - new Date(doc.lastPostAt).getTime() : Infinity;
    streak = elapsed > RESET_MS ? 0 : (doc.streak ?? 0) + 1; // đăng liên tục → tăng chuỗi
  }
  await c.updateOne({ _id: userId }, { $set: { day: today, count, lastPostAt: now, streak } }, { upsert: true });
}
