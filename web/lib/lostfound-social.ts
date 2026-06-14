// Bình luận & lượt thích cho tin tìm đồ rơi.
//   - lf_comments: bình luận phẳng theo postId (nội dung text thuần, render escape).
//   - lf_likes   : mỗi (postId,userId) một bản ghi (unique) → toggle + đếm.
import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";

const toId = (v: ObjectId | string): ObjectId => (typeof v === "string" ? new ObjectId(v) : v);

// ---- Bình luận ----
export type CommentDoc = {
  _id?: ObjectId;
  postId: ObjectId;
  postSlug: string;
  userId: ObjectId;
  userName: string;
  content: string;        // text thuần (render bằng React → tự escape)
  createdAt: Date;
};

export async function comments() {
  const db = await getDb();
  const col = db.collection<CommentDoc>("lf_comments");
  await ensureIndexes("lf_comments", () => col.createIndex({ postId: 1, createdAt: -1 }));
  return col;
}

export async function listComments(postId: ObjectId | string) {
  const col = await comments();
  return col.find({ postId: toId(postId) }).sort({ createdAt: -1 }).limit(500).toArray();
}

export async function countComments(postId: ObjectId | string) {
  return (await comments()).countDocuments({ postId: toId(postId) });
}

// Danh sách id người đã bình luận trong 1 tin (để thông báo cả thread).
export async function commenterIds(postId: ObjectId | string): Promise<string[]> {
  const ids = await (await comments()).distinct("userId", { postId: toId(postId) });
  return ids.map((i) => i.toString());
}

export async function addComment(
  post: { id: ObjectId | string; slug: string },
  user: { id: string; name: string },
  rawContent: string,
) {
  const content = rawContent.replace(/\s+\n/g, "\n").trim().slice(0, 1000);
  if (!content) throw new Error("Nội dung bình luận trống.");
  const col = await comments();
  const doc: CommentDoc = {
    postId: toId(post.id),
    postSlug: post.slug,
    userId: new ObjectId(user.id),
    userName: user.name,
    content,
    createdAt: new Date(),
  };
  const { insertedId } = await col.insertOne(doc);
  return { ...doc, _id: insertedId };
}

// Xoá bình luận: chỉ tác giả (hoặc admin truyền isAdmin=true).
export async function deleteComment(commentId: string, userId: string, isAdmin = false) {
  const col = await comments();
  const _id = ObjectId.isValid(commentId) ? new ObjectId(commentId) : null;
  if (!_id) return 0;
  const filter = isAdmin ? { _id } : { _id, userId: new ObjectId(userId) };
  const res = await col.deleteOne(filter);
  return res.deletedCount;
}

// ---- Lượt thích ----
export type LikeDoc = { _id?: ObjectId; postId: ObjectId; userId: ObjectId; createdAt: Date };

export async function likes() {
  const db = await getDb();
  const col = db.collection<LikeDoc>("lf_likes");
  await ensureIndexes("lf_likes", () => col.createIndex({ postId: 1, userId: 1 }, { unique: true }));
  return col;
}

// Bật/tắt thích → trả số đếm mới + trạng thái.
export async function toggleLike(postId: ObjectId | string, userId: string) {
  const col = await likes();
  const pid = toId(postId);
  const uid = new ObjectId(userId);
  const existing = await col.findOne({ postId: pid, userId: uid });
  let liked: boolean;
  if (existing) {
    await col.deleteOne({ _id: existing._id });
    liked = false;
  } else {
    await col.insertOne({ postId: pid, userId: uid, createdAt: new Date() });
    liked = true;
  }
  const count = await col.countDocuments({ postId: pid });
  return { liked, count };
}

// Số like + (tuỳ chọn) người dùng hiện tại đã thích chưa.
export async function likeInfo(postId: ObjectId | string, userId?: string) {
  const col = await likes();
  const pid = toId(postId);
  const count = await col.countDocuments({ postId: pid });
  const liked = userId ? !!(await col.findOne({ postId: pid, userId: new ObjectId(userId) })) : false;
  return { count, liked };
}
