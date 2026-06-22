import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

export type ActivityCategory = "auth" | "admin" | "user";

export type ActivityLog = {
  _id?: ObjectId;
  userId: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  category: ActivityCategory;
  action: string;
  target?: { type: string; id?: string; label?: string };
  success: boolean;
  detail?: string;
  ip?: string;
  createdAt: Date;
};

export type ActivityLogRow = Omit<ActivityLog, "_id"> & { id: string };

async function col() {
  const db = await getDb();
  const c = db.collection<ActivityLog>("activity_logs");
  await ensureIndexes("activity_logs", () =>
    Promise.all([
      c.createIndex({ createdAt: -1 }),
      c.createIndex({ userId: 1, createdAt: -1 }),
      c.createIndex({ category: 1, createdAt: -1 }),
      c.createIndex({ action: 1 }),
    ]),
  );
  return c;
}

// Fire-and-forget — bắt lỗi nội bộ, không bao giờ block request chính.
export async function logActivity(entry: Omit<ActivityLog, "_id" | "createdAt">): Promise<void> {
  try {
    const c = await col();
    await c.insertOne({ ...entry, createdAt: new Date() } as ActivityLog);
  } catch {
    // fail silently
  }
}

export type AnomalyItem = {
  type: "brute_force" | "bulk_delete" | "ban_surge" | "account_delete" | "role_change" | "login_flood";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  count?: number;
  extra?: string;
  lastSeen: Date;
};

export type LogFilter = {
  category?: ActivityCategory;
  userId?: string;
  action?: string;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export async function getActivityLogs(
  filter: LogFilter,
  page: number,
  pageSize: number,
): Promise<{ rows: ActivityLogRow[]; total: number }> {
  const c = await col();
  const q: Record<string, unknown> = {};
  if (filter.category) q.category = filter.category;
  if (filter.userId) q.userId = filter.userId;
  if (filter.action) q.action = filter.action;
  if (typeof filter.success === "boolean") q.success = filter.success;
  if (filter.dateFrom || filter.dateTo) {
    q.createdAt = {
      ...(filter.dateFrom ? { $gte: filter.dateFrom } : {}),
      ...(filter.dateTo ? { $lte: filter.dateTo } : {}),
    };
  }
  if (filter.search) {
    const esc = filter.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.$or = [
      { userName: { $regex: esc, $options: "i" } },
      { userEmail: { $regex: esc, $options: "i" } },
      { action: { $regex: esc, $options: "i" } },
      { "target.label": { $regex: esc, $options: "i" } },
    ];
  }
  const [docs, total] = await Promise.all([
    c.find(q).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    c.countDocuments(q),
  ]);
  return {
    rows: docs.map(({ _id, ...rest }) => ({ id: _id!.toString(), ...rest })),
    total,
  };
}

export async function getAnomalies(): Promise<AnomalyItem[]> {
  const c = await col();
  const now = Date.now();
  const since5m  = new Date(now -      5 * 60_000);
  const since15m = new Date(now -     15 * 60_000);
  const since1h  = new Date(now -  3_600_000);
  const since6h  = new Date(now -  6 * 3_600_000);
  const since24h = new Date(now - 24 * 3_600_000);

  const items: AnomalyItem[] = [];

  // 1. Brute-force: same IP ≥5 login failures in 15 min
  const bf = await c.aggregate<{ _id: string; count: number; lastSeen: Date }>([
    { $match: { action: "auth.login", success: false, createdAt: { $gte: since15m }, ip: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: "$ip", count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]).toArray();
  for (const r of bf) {
    items.push({
      type: "brute_force",
      severity: r.count >= 10 ? "high" : "medium",
      title: "Tấn công brute-force đăng nhập",
      detail: `IP ${r._id} thất bại ${r.count} lần trong 15 phút`,
      count: r.count,
      extra: r._id,
      lastSeen: r.lastSeen,
    });
  }

  // 2. Bulk delete: same user ≥5 deletes in 5 min
  const bd = await c.aggregate<{ _id: string; count: number; userName: string; lastSeen: Date }>([
    { $match: { action: { $regex: "\\.delete$" }, createdAt: { $gte: since5m } } },
    { $group: { _id: "$userId", count: { $sum: 1 }, userName: { $first: "$userName" }, lastSeen: { $max: "$createdAt" } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]).toArray();
  for (const r of bd) {
    items.push({
      type: "bulk_delete",
      severity: "high",
      title: "Xóa hàng loạt",
      detail: `${r.userName || "Người dùng ẩn danh"} xóa ${r.count} mục trong 5 phút`,
      count: r.count,
      extra: r.userName,
      lastSeen: r.lastSeen,
    });
  }

  // 3. Tài khoản bị khóa trong 24h
  const banAgg = await c.aggregate<{ count: number; lastSeen: Date }>([
    { $match: { action: "user.ban", createdAt: { $gte: since24h } } },
    { $group: { _id: null, count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
  ]).toArray();
  if (banAgg[0]?.count) {
    items.push({
      type: "ban_surge",
      severity: banAgg[0].count >= 5 ? "high" : "medium",
      title: "Tài khoản bị khóa",
      detail: `${banAgg[0].count} tài khoản bị khóa trong 24 giờ qua`,
      count: banAgg[0].count,
      lastSeen: banAgg[0].lastSeen,
    });
  }

  // 4. Tài khoản bị xóa trong 24h
  const delAgg = await c.aggregate<{ count: number; lastSeen: Date }>([
    { $match: { action: "user.delete", createdAt: { $gte: since24h } } },
    { $group: { _id: null, count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
  ]).toArray();
  if (delAgg[0]?.count) {
    items.push({
      type: "account_delete",
      severity: "high",
      title: "Tài khoản bị xóa vĩnh viễn",
      detail: `${delAgg[0].count} tài khoản bị xóa trong 24 giờ qua`,
      count: delAgg[0].count,
      lastSeen: delAgg[0].lastSeen,
    });
  }

  // 5. Thay đổi vai trò trong 6h
  const rcAgg = await c.aggregate<{ count: number; lastSeen: Date }>([
    { $match: { action: "user.setRole", createdAt: { $gte: since6h } } },
    { $group: { _id: null, count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
  ]).toArray();
  if (rcAgg[0]?.count) {
    items.push({
      type: "role_change",
      severity: "low",
      title: "Thay đổi vai trò người dùng",
      detail: `${rcAgg[0].count} lần thay đổi vai trò trong 6 giờ qua`,
      count: rcAgg[0].count,
      lastSeen: rcAgg[0].lastSeen,
    });
  }

  // 6. Tổng lỗi đăng nhập toàn hệ thống trong 1h (≥20)
  const floodAgg = await c.aggregate<{ count: number; lastSeen: Date }>([
    { $match: { action: "auth.login", success: false, createdAt: { $gte: since1h } } },
    { $group: { _id: null, count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
  ]).toArray();
  if (floodAgg[0]?.count >= 20) {
    items.push({
      type: "login_flood",
      severity: floodAgg[0].count >= 50 ? "high" : "medium",
      title: "Nhiều lần đăng nhập thất bại",
      detail: `${floodAgg[0].count} lần thất bại trong 1 giờ qua trên toàn hệ thống`,
      count: floodAgg[0].count,
      lastSeen: floodAgg[0].lastSeen,
    });
  }

  const SEV_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return items.sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || b.lastSeen.getTime() - a.lastSeen.getTime(),
  );
}
