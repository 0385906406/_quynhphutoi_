// Bình luận & lượt thích DÙNG CHUNG cho các trang chi tiết (di tích, y tế, giao thông,
// chợ, trường học, việc làm, mua bán). Khóa theo target = `${type}:${slug}`.
import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

export const SOCIAL_TYPES = ["cho", "di-tich", "giao-thong", "mua-ban", "truong-hoc", "viec-lam", "y-te"] as const;
export type SocialType = (typeof SOCIAL_TYPES)[number];
export const isSocialType = (t: string): t is SocialType => (SOCIAL_TYPES as readonly string[]).includes(t);

export const SOCIAL_LABEL: Record<SocialType, string> = {
  "cho": "Chợ", "di-tich": "Di tích", "giao-thong": "Giao thông", "mua-ban": "Mua bán",
  "truong-hoc": "Trường học", "viec-lam": "Việc làm", "y-te": "Y tế",
};

const target = (type: string, slug: string) => `${type}:${slug}`;

// Map type → collection để kiểm tra mục có thật không (chống bình luận/like vào slug giả).
const SOCIAL_COLL: Record<SocialType, string> = {
  "cho": "market", "di-tich": "relics", "giao-thong": "transit", "mua-ban": "classifieds",
  "truong-hoc": "schools", "viec-lam": "jobs", "y-te": "health",
};
export async function socialTargetExists(type: SocialType, slug: string): Promise<boolean> {
  const db = await getDb();
  const hit = await db.collection(SOCIAL_COLL[type]).findOne({ slug }, { projection: { _id: 1 } });
  return !!hit;
}

// ---- Bình luận ----
export type SocialCommentDoc = {
  _id?: ObjectId;
  target: string;          // type:slug
  userId: ObjectId;
  userName: string;
  content: string;
  createdAt: Date;
};

export async function socialComments() {
  const db = await getDb();
  const col = db.collection<SocialCommentDoc>("social_comments");
  await ensureIndexes("social_comments", () => col.createIndex({ target: 1, createdAt: -1 }));
  return col;
}

export async function listSocialComments(type: string, slug: string) {
  return (await socialComments()).find({ target: target(type, slug) }).sort({ createdAt: -1 }).limit(500).toArray();
}

export async function addSocialComment(type: string, slug: string, user: { id: string; name: string }, rawContent: string) {
  const content = rawContent.replace(/\s+\n/g, "\n").trim().slice(0, 1000);
  if (!content) throw new Error("Nội dung bình luận trống.");
  const col = await socialComments();
  const doc: SocialCommentDoc = { target: target(type, slug), userId: new ObjectId(user.id), userName: user.name, content, createdAt: new Date() };
  const { insertedId } = await col.insertOne(doc);
  return { ...doc, _id: insertedId };
}

export async function deleteSocialComment(commentId: string, userId: string, isAdmin = false) {
  if (!ObjectId.isValid(commentId)) return 0;
  const _id = new ObjectId(commentId);
  const col = await socialComments();
  const res = await col.deleteOne(isAdmin ? { _id } : { _id, userId: new ObjectId(userId) });
  return res.deletedCount;
}

export async function socialCommenterIds(type: string, slug: string): Promise<string[]> {
  const ids = await (await socialComments()).distinct("userId", { target: target(type, slug) });
  return ids.map((i) => i.toString());
}

// ---- Lượt thích ----
export type SocialLikeDoc = { _id?: ObjectId; target: string; userId: ObjectId; createdAt: Date };

export async function socialLikes() {
  const db = await getDb();
  const col = db.collection<SocialLikeDoc>("social_likes");
  await ensureIndexes("social_likes", () => col.createIndex({ target: 1, userId: 1 }, { unique: true }));
  return col;
}

export async function toggleSocialLike(type: string, slug: string, userId: string) {
  const col = await socialLikes();
  const t = target(type, slug);
  const uid = new ObjectId(userId);
  const existing = await col.findOne({ target: t, userId: uid });
  let liked: boolean;
  if (existing) { await col.deleteOne({ _id: existing._id }); liked = false; }
  else { await col.insertOne({ target: t, userId: uid, createdAt: new Date() }); liked = true; }
  const count = await col.countDocuments({ target: t });
  return { liked, count };
}

export async function socialLikeInfo(type: string, slug: string, userId?: string) {
  const col = await socialLikes();
  const t = target(type, slug);
  const count = await col.countDocuments({ target: t });
  const liked = userId ? !!(await col.findOne({ target: t, userId: new ObjectId(userId) })) : false;
  return { count, liked };
}
