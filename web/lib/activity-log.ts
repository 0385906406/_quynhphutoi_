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

export type LogFilter = {
  category?: ActivityCategory;
  userId?: string;
  action?: string;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
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
  const [docs, total] = await Promise.all([
    c.find(q).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    c.countDocuments(q),
  ]);
  return {
    rows: docs.map(({ _id, ...rest }) => ({ id: _id!.toString(), ...rest })),
    total,
  };
}
