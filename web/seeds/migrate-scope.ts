// Migration một lần: đổi mã phạm vi tin tức cũ sang mã mới.
//   ngoai-tinh -> ngoai-xa
//   trong-tinh -> trong-xa
// Bài thiếu field `scope` để nguyên (lọc mặc định coi như "trong-xa"). Idempotent:
// chạy lại lần 2 sẽ không còn bản ghi nào để đổi (in 0).
//
// Cách chạy (trong web/):  npm run seed:migrate-scope
// hoặc:  node --experimental-strip-types --env-file=.env.local seeds/migrate-scope.ts

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection("articles");
    const out = await col.updateMany({ scope: "ngoai-tinh" }, { $set: { scope: "ngoai-xa" } });
    const inn = await col.updateMany({ scope: "trong-tinh" }, { $set: { scope: "trong-xa" } });
    console.log(`Đã đổi: ngoai-tinh→ngoai-xa = ${out.modifiedCount}, trong-tinh→trong-xa = ${inn.modifiedCount}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
