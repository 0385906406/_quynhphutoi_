/**
 * Script: thay thế "cổng thông tin" → "trang cộng đồng" trong DB settings + page_seo.
 * Chạy:  node --env-file=.env.local scripts/fix-seo-brand.mjs
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

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // ── 1. Collection: settings ──────────────────────────────────────────────
  const settingsCol = db.collection("settings");
  const settingsDoc = await settingsCol.findOne({ _id: "app" });

  if (settingsDoc?.values) {
    const v = settingsDoc.values;
    const patch = {};

    if (v.seoSiteName)        patch["values.seoSiteName"]        = replaceBrand(v.seoSiteName);
    if (v.seoSiteDescription) patch["values.seoSiteDescription"] = replaceBrand(v.seoSiteDescription);

    if (Object.keys(patch).length) {
      await settingsCol.updateOne({ _id: "app" }, { $set: patch });
      console.log("✓ settings:", patch);
    } else {
      console.log("— settings: không có gì cần sửa");
    }
  } else {
    console.log("— settings: document 'app' chưa có hoặc rỗng");
  }

  // ── 2. Collection: page_seo ──────────────────────────────────────────────
  const pageSeoCol = db.collection("page_seo");
  const pageSeoDoc = await pageSeoCol.findOne({ _id: "pages" });

  if (pageSeoDoc?.pages) {
    const pages = pageSeoDoc.pages;
    const updatedPages = {};
    let changed = 0;

    for (const [key, ov] of Object.entries(pages)) {
      if (!ov || typeof ov !== "object") { updatedPages[key] = ov; continue; }
      const next = { ...ov };
      let dirty = false;

      if (ov.title)       { const r = replaceBrand(ov.title);       if (r !== ov.title)       { next.title = r;       dirty = true; } }
      if (ov.description) { const r = replaceBrand(ov.description); if (r !== ov.description) { next.description = r; dirty = true; } }

      updatedPages[key] = next;
      if (dirty) {
        changed++;
        console.log(`✓ page_seo [${key}]:`, { title: next.title, description: next.description });
      }
    }

    if (changed) {
      await pageSeoCol.updateOne({ _id: "pages" }, { $set: { pages: updatedPages } }, { upsert: true });
      console.log(`✓ page_seo: đã cập nhật ${changed} trang`);
    } else {
      console.log("— page_seo: không có gì cần sửa");
    }
  } else {
    console.log("— page_seo: document 'pages' chưa có");
  }

  await client.close();
  console.log("\n✅ Xong.");
}

main().catch(err => { console.error("❌", err); process.exit(1); });
