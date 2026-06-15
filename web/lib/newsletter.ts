// Đăng ký nhận tin qua email (newsletter). Lưu DB để admin xem/xuất danh sách.
import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

export type NewsletterDoc = {
  _id?: ObjectId;
  email: string;
  source?: string;   // nơi đăng ký: "home" | "article" | …
  createdAt: Date;
};

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function subscribers() {
  const db = await getDb();
  const col = db.collection<NewsletterDoc>("newsletter_subscribers");
  await ensureIndexes("newsletter_subscribers", () => Promise.all([
    col.createIndex({ email: 1 }, { unique: true }),
    col.createIndex({ createdAt: -1 }),
  ]));
  return col;
}

// Trả về true nếu là email mới (chưa từng đăng ký).
export async function subscribe(email: string, source?: string): Promise<boolean> {
  const col = await subscribers();
  const e = email.trim().toLowerCase();
  const res = await col.updateOne(
    { email: e },
    { $setOnInsert: { email: e, source: source || "web", createdAt: new Date() } },
    { upsert: true },
  );
  return res.upsertedCount > 0;
}

export async function listSubscribers(opts: { limit?: number } = {}) {
  const col = await subscribers();
  return col.find({}).sort({ createdAt: -1 }).limit(opts.limit ?? 2000).toArray();
}

export async function countSubscribers() {
  return (await subscribers()).countDocuments({});
}

export async function removeSubscriber(id: string) {
  if (!ObjectId.isValid(id)) return 0;
  const res = await (await subscribers()).deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount;
}

export type SubscriberRow = { id: string; email: string; source: string; createdAt: string };
export function toSubscriberRow(d: NewsletterDoc): SubscriberRow {
  return { id: d._id!.toString(), email: d.email, source: d.source ?? "", createdAt: d.createdAt.toISOString() };
}
