// Bình luận & lượt thích cho bài viết tin tức.
// Vì tin tức là dữ liệu tĩnh (không có _id trong DB) nên khóa theo articleSlug (string).
//   - news_comments: bình luận phẳng theo slug (text thuần, render escape).
//   - news_likes   : mỗi (slug,userId) một bản ghi (unique) → toggle + đếm.
import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

// ---- Bình luận ----
export type NewsCommentDoc = {
  _id?: ObjectId;
  slug: string;
  userId: ObjectId;
  userName: string;
  content: string;        // text thuần
  createdAt: Date;
};

export async function newsComments() {
  const db = await getDb();
  const col = db.collection<NewsCommentDoc>("news_comments");
  await ensureIndexes("news_comments", () => col.createIndex({ slug: 1, createdAt: -1 }));
  return col;
}

export async function listNewsComments(slug: string) {
  const col = await newsComments();
  return col.find({ slug }).sort({ createdAt: -1 }).limit(500).toArray();
}

export async function countNewsComments(slug: string) {
  return (await newsComments()).countDocuments({ slug });
}

// Danh sách id người đã bình luận bài viết (để thông báo cả thread).
export async function newsCommenterIds(slug: string): Promise<string[]> {
  const ids = await (await newsComments()).distinct("userId", { slug });
  return ids.map((i) => i.toString());
}

export async function addNewsComment(slug: string, user: { id: string; name: string }, rawContent: string) {
  const content = rawContent.replace(/\s+\n/g, "\n").trim().slice(0, 1000);
  if (!content) throw new Error("Nội dung bình luận trống.");
  const col = await newsComments();
  const doc: NewsCommentDoc = { slug, userId: new ObjectId(user.id), userName: user.name, content, createdAt: new Date() };
  const { insertedId } = await col.insertOne(doc);
  return { ...doc, _id: insertedId };
}

// Xoá bình luận: chỉ tác giả (hoặc admin truyền isAdmin=true).
export async function deleteNewsComment(commentId: string, userId: string, isAdmin = false) {
  const col = await newsComments();
  const _id = ObjectId.isValid(commentId) ? new ObjectId(commentId) : null;
  if (!_id) return 0;
  const filter = isAdmin ? { _id } : { _id, userId: new ObjectId(userId) };
  const res = await col.deleteOne(filter);
  return res.deletedCount;
}

// ---- Lượt thích ----
export type NewsLikeDoc = { _id?: ObjectId; slug: string; userId: ObjectId; createdAt: Date };

export async function newsLikes() {
  const db = await getDb();
  const col = db.collection<NewsLikeDoc>("news_likes");
  await ensureIndexes("news_likes", () => col.createIndex({ slug: 1, userId: 1 }, { unique: true }));
  return col;
}

export async function toggleNewsLike(slug: string, userId: string) {
  const col = await newsLikes();
  const uid = new ObjectId(userId);
  const existing = await col.findOne({ slug, userId: uid });
  let liked: boolean;
  if (existing) { await col.deleteOne({ _id: existing._id }); liked = false; }
  else { await col.insertOne({ slug, userId: uid, createdAt: new Date() }); liked = true; }
  const count = await col.countDocuments({ slug });
  return { liked, count };
}

export async function newsLikeInfo(slug: string, userId?: string) {
  const col = await newsLikes();
  const count = await col.countDocuments({ slug });
  const liked = userId ? !!(await col.findOne({ slug, userId: new ObjectId(userId) })) : false;
  return { count, liked };
}
