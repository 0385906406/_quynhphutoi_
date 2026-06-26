/**
 * Script: sửa "Cổng thông tin" → "Trang cộng đồng" trong collection articles.
 * Chỉnh author.title và body[].text / body[].items có chứa cụm cũ.
 *
 * Chạy: node --env-file=.env.local scripts/fix-articles-brand.mjs
 */
import { MongoClient } from "mongodb";

const uri    = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB  || "quynhphu";

function replaceBrand(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/Cổng thông tin cộng đồng Quỳnh Phụ/gi, "Trang cộng đồng Quỳnh Phụ")
    .replace(/Cổng thông tin xã Quỳnh Phụ/gi,        "Trang cộng đồng Quỳnh Phụ")
    .replace(/Cổng thông tin Quỳnh Phụ/gi,            "Trang cộng đồng Quỳnh Phụ")
    .replace(/cổng thông tin cộng đồng/gi,            "trang cộng đồng")
    .replace(/cổng thông tin xã/gi,                   "trang cộng đồng")
    .replace(/cổng thông tin/gi,                      "trang cộng đồng");
}

function fixBlock(block) {
  if (!block || typeof block !== "object") return block;
  const next = { ...block };
  if (typeof next.text === "string")   next.text  = replaceBrand(next.text);
  if (typeof next.cite === "string")   next.cite  = replaceBrand(next.cite);
  if (Array.isArray(next.items))       next.items = next.items.map(replaceBrand);
  return next;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("articles");

  // Lấy tất cả article, chỉ fix những field cần thiết
  const docs = await col.find({}).project({ _id: 1, author: 1, body: 1 }).toArray();

  let fixed = 0;
  for (const doc of docs) {
    const patch = {};

    // author.title
    if (doc.author?.title) {
      const fixed_title = replaceBrand(doc.author.title);
      if (fixed_title !== doc.author.title) {
        patch["author.title"] = fixed_title;
      }
    }

    // author.name (phòng hờ)
    if (doc.author?.name) {
      const fixed_name = replaceBrand(doc.author.name);
      if (fixed_name !== doc.author.name) {
        patch["author.name"] = fixed_name;
      }
    }

    // body blocks
    if (Array.isArray(doc.body)) {
      const fixedBody = doc.body.map(fixBlock);
      const bodyChanged = JSON.stringify(fixedBody) !== JSON.stringify(doc.body);
      if (bodyChanged) patch["body"] = fixedBody;
    }

    if (Object.keys(patch).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: patch });
      fixed++;
      console.log(`✓ [${doc._id}] fixed:`, Object.keys(patch).join(", "));
    }
  }

  await client.close();
  console.log(`\n✅ Xong. Đã sửa ${fixed}/${docs.length} bài viết.`);
}

main().catch(err => { console.error("❌", err); process.exit(1); });
