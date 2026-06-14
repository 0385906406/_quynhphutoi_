// Tổng hợp số liệu cho dashboard quản trị (đếm + chuỗi thời gian).
import { getDb } from "@/lib/db";

const DAY = 86_400_000;

export type DayPoint = { date: string; jobs: number; lostfound: number; classifieds: number; articles: number; total: number };

// Số tin/bài đăng mới mỗi ngày trong `days` ngày gần nhất (4 phân hệ + tổng).
export async function dailyNewCounts(days = 14): Promise<DayPoint[]> {
  const db = await getDb();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setTime(since.getTime() - (days - 1) * DAY);

  const sources: { coll: string; key: "jobs" | "lostfound" | "classifieds" | "articles" }[] = [
    { coll: "jobs", key: "jobs" },
    { coll: "lost_found", key: "lostfound" },
    { coll: "classifieds", key: "classifieds" },
    { coll: "articles", key: "articles" },
  ];

  const buckets = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * DAY);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, jobs: 0, lostfound: 0, classifieds: 0, articles: 0, total: 0 });
  }

  await Promise.all(sources.map(async ({ coll, key }) => {
    const rows = await db.collection(coll).aggregate<{ _id: string; n: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
    ]).toArray();
    for (const r of rows) {
      const b = buckets.get(r._id);
      if (b) { b[key] = r.n; b.total += r.n; }
    }
  }));

  return [...buckets.values()];
}

// Thống kê người dùng.
export async function userStats() {
  const db = await getDb();
  const c = db.collection("users");
  const [total, admins, verified] = await Promise.all([
    c.countDocuments({}),
    c.countDocuments({ role: "admin" }),
    c.countDocuments({ verified: true }),
  ]);
  return { total, admins, verified };
}
