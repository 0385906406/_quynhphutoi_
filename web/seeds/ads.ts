// Seed quảng cáo demo (4 vị trí). Upsert theo (advertiser, placement) để không trùng.
// Chạy: npm run seed:ads
import { MongoClient } from "mongodb";
import type { AdDoc } from "../lib/ads";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";

type Seed = Pick<AdDoc, "advertiser" | "title" | "imageDesktop" | "linkUrl" | "placement" | "weight" | "active">;

const ADS: Seed[] = [
  { advertiser: "Điện máy Quỳnh Côi", title: "Khai trương — giảm đến 30% toàn bộ điện máy", placement: "home-banner", weight: 2, active: true,
    imageDesktop: "https://loremflickr.com/1200/300/electronics,store?lock=901", linkUrl: "https://example.com/dien-may" },
  { advertiser: "Nhà hàng Sông Quê", title: "Đặt tiệc cuối năm — ưu đãi cho nhóm trên 10 khách", placement: "footer", weight: 1, active: true,
    imageDesktop: "https://loremflickr.com/1200/300/restaurant?lock=902", linkUrl: "https://example.com/nha-hang" },
  { advertiser: "Thời trang An Bài", title: "Bộ sưu tập mới — mua 2 tặng 1", placement: "detail-aside", weight: 1, active: true,
    imageDesktop: "https://loremflickr.com/600/500/fashion,shopping?lock=903", linkUrl: "https://example.com/thoi-trang" },
  { advertiser: "Siêu thị Mini Quỳnh Phụ", title: "Ưu đãi cuối tuần — giao hàng tận nhà trong huyện", placement: "in-feed", weight: 1, active: true,
    imageDesktop: "https://loremflickr.com/800/450/supermarket,business?lock=904", linkUrl: "https://example.com/sieu-thi" },
  { advertiser: "Cà phê Đồng Quê", title: "Khai trương quán mới — tặng nước cho 100 khách đầu", placement: "sticky-bottom", weight: 1, active: true,
    imageDesktop: "https://loremflickr.com/200/200/coffee?lock=905", linkUrl: "https://example.com/ca-phe" },
  { advertiser: "Garage Ô tô Quỳnh Côi", title: "Bảo dưỡng xe — giảm 15% dịp cuối năm", placement: "sticky-bottom", weight: 1, active: true,
    imageDesktop: "https://loremflickr.com/200/200/car,garage?lock=906", linkUrl: "https://example.com/garage" },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection<AdDoc>("ads");
    await col.createIndex({ placement: 1, active: 1 });
    const now = new Date();
    for (const a of ADS) {
      await col.updateOne(
        { advertiser: a.advertiser, placement: a.placement },
        {
          $set: { ...a, startDate: null, endDate: null, updatedAt: now },
          $setOnInsert: { impressions: 0, clicks: 0, createdAt: now },
        },
        { upsert: true },
      );
    }
    console.log(`✓ Quảng cáo demo: ${ADS.length} (mỗi vị trí 1)`);
    console.log(`\n✅ Đã seed quảng cáo vào "${dbName}".`);
  } finally {
    await client.close();
  }
}
main().catch((e) => { console.error("❌ Seed thất bại:", e); process.exit(1); });
