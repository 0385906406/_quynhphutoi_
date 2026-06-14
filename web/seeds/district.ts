// Seed hồ sơ tổng quan huyện Quỳnh Phụ (1 document). Upsert theo key.
// Chạy: npm run seed:district
import { MongoClient } from "mongodb";
import { isCli } from "./_cli";
import type { DistrictDoc } from "../lib/district";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";
const KEY = "quynh-phu";

const DOC: Omit<DistrictDoc, "_id" | "createdAt" | "updatedAt"> = {
  key: KEY,
  name: "Quỳnh Phụ",
  fullName: "Huyện Quỳnh Phụ",
  province: "Thái Bình",
  region: "Đồng bằng sông Hồng",
  established:
    "Thành lập ngày 17/6/1969 trên cơ sở hợp nhất hai huyện Quỳnh Côi và Phụ Dực; tên huyện ghép từ Quỳnh Côi và Phụ Dực.",

  area: 209.6,
  areaText: "209,6",
  population: 244000,
  populationText: "≈ 244.000",
  populationYear: 2019,

  capital: "Thị trấn Quỳnh Côi",
  townships: ["Quỳnh Côi", "An Bài"],
  rivers: ["Sông Luộc", "Sông Hoá", "Sông Diêm Hộ"],
  highways: ["Quốc lộ 10", "ĐT.396B", "ĐT.452", "ĐT.455"],

  borders: [
    { dir: "Bắc", desc: "Giáp tỉnh Hưng Yên và Hải Dương, ngăn cách bởi sông Luộc" },
    { dir: "Đông", desc: "Giáp thành phố Hải Phòng, ngăn cách bởi sông Hoá" },
    { dir: "Nam", desc: "Giáp huyện Thái Thuỵ và huyện Đông Hưng" },
    { dir: "Tây", desc: "Giáp huyện Hưng Hà" },
  ],

  sections: [
    {
      title: "Vị trí địa lý",
      body:
        "Quỳnh Phụ nằm ở phía đông bắc tỉnh Thái Bình, là cửa ngõ nối Thái Bình với Hải Phòng, Hải Dương và Hưng Yên. " +
        "Địa hình đồng bằng thấp, bằng phẳng, được bồi đắp bởi hệ thống sông Luộc, sông Hoá và sông Diêm Hộ. " +
        "Quốc lộ 10 chạy qua địa bàn tạo trục giao thông huyết mạch, thuận lợi cho giao thương và phát triển công nghiệp.",
    },
    {
      title: "Lịch sử hình thành",
      body:
        "Vùng đất Quỳnh Phụ có bề dày lịch sử, gắn với nhiều sự kiện thời Trần và phong trào yêu nước. " +
        "Huyện Quỳnh Phụ được thành lập ngày 17/6/1969 do hợp nhất hai huyện Quỳnh Côi và Phụ Dực — " +
        "tên huyện chính là sự ghép tên của hai vùng đất giàu truyền thống này.",
    },
    {
      title: "Kinh tế",
      body:
        "Kinh tế Quỳnh Phụ lấy nông nghiệp làm nền tảng: vùng trọng điểm lúa chất lượng cao, chăn nuôi gia súc, gia cầm " +
        "và nuôi trồng thuỷ sản của tỉnh Thái Bình. Công nghiệp — tiểu thủ công nghiệp phát triển tại các cụm công nghiệp " +
        "Quỳnh Côi, An Bài cùng nhiều làng nghề truyền thống (dệt chiếu, mây tre đan, chế biến nông sản).",
    },
    {
      title: "Văn hoá - Di sản",
      body:
        "Quỳnh Phụ là vùng đất giàu di tích lịch sử - văn hoá với hệ thống đình, chùa, đền, miếu dày đặc. " +
        "Tiêu biểu là đền A Sào thờ Hưng Đạo Đại Vương Trần Quốc Tuấn và đền Đồng Bằng thờ Đức Vua Cha Bát Hải Động Đình — " +
        "những trung tâm tín ngưỡng lớn với lễ hội thu hút đông đảo du khách thập phương.",
    },
  ],

  highlights: [
    { value: "209,6", unit: "km²", label: "Diện tích tự nhiên" },
    { value: "≈ 244.000", unit: "người", label: "Dân số (2019)" },
    { value: "1969", unit: "", label: "Năm thành lập huyện" },
    { value: "2", unit: "thị trấn", label: "Quỳnh Côi · An Bài" },
  ],

  specialties: [
    "Bánh cáy",
    "Gạo chất lượng cao",
    "Đền A Sào",
    "Đền Đồng Bằng",
    "Cụm công nghiệp Quỳnh Côi",
    "Cụm công nghiệp An Bài",
  ],

  source: "Tổng hợp từ nhiều nguồn công khai; số liệu mang tính tham khảo.",
};

export function seedDocs() {
  const now = new Date();
  return [{ ...DOC, createdAt: now, updatedAt: now }];
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection<DistrictDoc>("district");
    await col.createIndex({ key: 1 }, { unique: true });
    const now = new Date();
    await col.updateOne(
      { key: KEY },
      { $set: { ...DOC, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    console.log(`✓ Hồ sơ huyện     : ${DOC.fullName}`);
    console.log(`✓ Số mục giới thiệu: ${DOC.sections.length}`);
    console.log(`✓ Đặc sản/điểm nhấn: ${DOC.specialties?.length ?? 0}`);
    console.log(`\n✅ Đã seed hồ sơ tổng quan vào "${dbName}".`);
  } finally {
    await client.close();
  }
}
if (isCli(import.meta.url)) main().catch((e) => { console.error("❌ Seed thất bại:", e); process.exit(1); });
