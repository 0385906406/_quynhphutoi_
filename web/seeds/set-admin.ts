// Gán (hoặc gỡ) quyền admin cho 1 tài khoản theo email.
//
// Dùng:
//   npm run set-admin -- email@cua-ban.com          → đặt role = admin
//   npm run set-admin -- email@cua-ban.com user      → gỡ về role = user
//
// Tài khoản phải đã đăng ký trước (có trong collection users).

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";

const email = process.argv[2]?.trim().toLowerCase();
const role = (process.argv[3] || "admin").trim() === "user" ? "user" : "admin";

if (!email) {
  console.error("❌ Thiếu email. Dùng: npm run set-admin -- email@cua-ban.com [admin|user]");
  process.exit(1);
}

async function main() {
  const c = new MongoClient(uri);
  await c.connect();
  try {
    const res = await c.db(dbName).collection("users").updateOne(
      { email },
      { $set: { role } },
    );
    if (res.matchedCount === 0) {
      console.error(`❌ Không tìm thấy user ${email}. Hãy đăng ký tài khoản này trước.`);
      process.exit(1);
    }
    console.log(`✅ Đã đặt role="${role}" cho ${email}.`);
  } finally {
    await c.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
