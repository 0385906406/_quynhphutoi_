// Liên hệ / phản ánh từ form công khai. Lưu DB để admin xử lý.
import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

export const CONTACT_TYPES = ["Đặt quảng cáo", "Hợp tác / tài trợ", "Góp ý nội dung", "Báo lỗi / phản ánh", "Khác"];

export type ContactDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
  handled: boolean;
  createdAt: Date;
};

export async function contacts() {
  const db = await getDb();
  const col = db.collection<ContactDoc>("contacts");
  await ensureIndexes("contacts", () => col.createIndex({ handled: 1, createdAt: -1 }));
  return col;
}

export type CreateContactInput = { name: string; email: string; phone?: string; type: string; message: string };

export async function createContact(input: CreateContactInput) {
  const doc: ContactDoc = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    type: CONTACT_TYPES.includes(input.type) ? input.type : "Khác",
    message: input.message.trim(),
    handled: false,
    createdAt: new Date(),
  };
  const { insertedId } = await contacts().then((c) => c.insertOne(doc));
  return { ...doc, _id: insertedId };
}

export async function listContacts(opts: { handled?: boolean; limit?: number } = {}) {
  const col = await contacts();
  const filter = typeof opts.handled === "boolean" ? { handled: opts.handled } : {};
  return col.find(filter).sort({ handled: 1, createdAt: -1 }).limit(opts.limit ?? 500).toArray();
}

export async function countPendingContacts() {
  return (await contacts()).countDocuments({ handled: false });
}

export async function setContactHandled(id: string, handled: boolean) {
  if (!ObjectId.isValid(id)) return 0;
  const res = await (await contacts()).updateOne({ _id: new ObjectId(id) }, { $set: { handled } });
  return res.matchedCount;
}

export async function deleteContact(id: string) {
  if (!ObjectId.isValid(id)) return 0;
  const res = await (await contacts()).deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount;
}

export type ContactRow = { id: string; name: string; email: string; phone: string; type: string; message: string; handled: boolean; createdAt: string };
export function toContactRow(d: ContactDoc): ContactRow {
  return {
    id: d._id!.toString(), name: d.name, email: d.email, phone: d.phone ?? "", type: d.type,
    message: d.message, handled: d.handled, createdAt: d.createdAt.toISOString(),
  };
}
