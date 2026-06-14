// Seed tin demo "Tìm đồ rơi" — trộn tin tìm đồ (người mất) & nhặt được (người nhặt).
//
// Phụ thuộc:
//   - Cây danh mục module "tim-do-roi" phải seed trước: npm run seed:categories
//     (seed này tra categoryId thật theo path, vd "/giay-to/cccd").
//   - Cần 1 user làm người đăng (postedBy). Nếu collection users rỗng, seed tạo
//     1 tài khoản demo: demo@quynhphu.vn / 123456 (verified).
//
// Idempotent: upsert theo slug + prune các tin demo cũ. Chạy: npm run seed:lostfound

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import type { LostFoundDoc } from "../lib/lostfound"; // chỉ lấy kiểu — bị xoá khi chạy
import type { CategoryDoc } from "../lib/categories";
import type { UserDoc } from "../lib/users";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";
const MODULE = "tim-do-roi";

function slugify(s: string) {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-");
}

// Ảnh thật theo chủ đề (loremflickr, ?lock cố định để seed ổn định).
const img = (kw: string, ...locks: number[]) => locks.map((l) => `https://loremflickr.com/800/600/${kw}?lock=${l}`);

// Cấu hình tin demo — categoryPath trỏ tới node lá trong cây tim-do-roi.
type SeedPost = {
  kind: "tim-do" | "nhat-duoc";
  slug: string;
  title: string;
  description: string;
  categoryPath: string;
  ward: string;
  occurredAt: string;       // ISO
  contact: { name: string; phone: string };
  reward?: string;
  approved: boolean;        // true = hiện public ngay
  daysAgo: number;          // lùi createdAt cho đa dạng
  images: string[];
};

const POSTS: SeedPost[] = [
  {
    kind: "tim-do",
    slug: "danh-roi-cccd-quynh-coi",
    title: "Đánh rơi Căn cước công dân tại chợ Quỳnh Côi",
    description: "Tôi đánh rơi CCCD mang tên Nguyễn Văn A khu vực chợ Quỳnh Côi sáng nay. Ai nhặt được xin liên hệ, hậu tạ.",
    categoryPath: "/giay-to/cccd",
    ward: "Thị trấn Quỳnh Côi",
    occurredAt: "2026-06-09T08:00:00+07:00",
    contact: { name: "Nguyễn Văn A", phone: "0912345678" },
    reward: "Hậu tạ 200.000đ",
    approved: true,
    daysAgo: 2,
    images: img("card", 201, 202),
  },
  {
    kind: "nhat-duoc",
    slug: "nhat-duoc-vi-tien-an-bai",
    title: "Nhặt được ví tiền màu nâu gần Quốc lộ 10 (An Bài)",
    description: "Nhặt được ví da nâu có một ít tiền và vài thẻ ngân hàng, gần ngã tư thị trấn An Bài. Ai mất liên hệ mô tả để nhận lại.",
    categoryPath: "/vi-tai-san/vi-tien",
    ward: "Thị trấn An Bài",
    occurredAt: "2026-06-10T17:30:00+07:00",
    contact: { name: "Trần Thị B", phone: "0987654321" },
    approved: true,
    daysAgo: 1,
    images: img("wallet", 211, 212),
  },
  {
    kind: "tim-do",
    slug: "mat-dien-thoai-iphone-quynh-hong",
    title: "Mất điện thoại iPhone tại xã Quỳnh Hồng",
    description: "Để quên điện thoại iPhone vỏ đen trên xe khách tuyến Quỳnh Hồng. Rất mong ai nhặt được liên hệ giúp.",
    categoryPath: "/vi-tai-san/dien-thoai",
    ward: "Xã Quỳnh Hồng",
    occurredAt: "2026-06-08T19:00:00+07:00",
    contact: { name: "Lê Văn C", phone: "0901112223" },
    reward: "Hậu tạ xứng đáng",
    approved: true,
    daysAgo: 3,
    images: img("smartphone", 221, 222),
  },
  {
    kind: "nhat-duoc",
    slug: "nhat-duoc-cho-co-vong-quynh-ngoc",
    title: "Nhặt được một chú chó đi lạc ở Quỳnh Ngọc",
    description: "Có một chú chó vàng đeo vòng cổ đi lạc vào nhà tôi tại Quỳnh Ngọc. Đang chăm sóc, ai mất liên hệ nhận lại.",
    categoryPath: "/thu-cung/cho",
    ward: "Xã Quỳnh Ngọc",
    occurredAt: "2026-06-07T07:15:00+07:00",
    contact: { name: "Phạm Thị D", phone: "0934445556" },
    approved: true,
    daysAgo: 4,
    images: img("dog", 231, 232),
  },
  {
    kind: "tim-do",
    slug: "mat-chia-khoa-xe-may-quynh-hai",
    title: "Mất chùm chìa khoá xe máy ở xã Quỳnh Hải",
    description: "Đánh rơi chùm chìa khoá có móc hình con mèo khu vực UBND xã Quỳnh Hải. Ai nhặt được xin báo giúp.",
    categoryPath: "/vi-tai-san/chia-khoa",
    ward: "Xã Quỳnh Hải",
    occurredAt: "2026-06-10T11:00:00+07:00",
    contact: { name: "Đỗ Văn E", phone: "0967778889" },
    approved: false, // chờ duyệt — demo trạng thái chưa public
    daysAgo: 0,
    images: img("keys", 241, 242),
  },
  {
    kind: "nhat-duoc",
    slug: "nhat-duoc-giay-phep-lai-xe-an-vu",
    title: "Nhặt được Giấy phép lái xe tại xã An Vũ",
    description: "Nhặt được GPLX mang tên Vũ Văn F ven Quốc lộ 10 đoạn qua An Vũ. Liên hệ để nhận lại.",
    categoryPath: "/giay-to/giay-phep-lai-xe",
    ward: "Xã An Vũ",
    occurredAt: "2026-06-09T16:45:00+07:00",
    contact: { name: "Hoàng Văn G", phone: "0978889990" },
    approved: true,
    daysAgo: 2,
    images: img("card", 251, 252),
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const cats = db.collection<CategoryDoc>("categories");
    const usersCol = db.collection<UserDoc>("users");
    const col = db.collection<LostFoundDoc>("lost_found");

    // Index (khớp lib/lostfound.ts).
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ kind: 1, categorySlug: 1, status: 1, createdAt: -1 });
    await col.createIndex({ "location.wardSlug": 1, createdAt: -1 });
    await col.createIndex({ postedBy: 1, createdAt: -1 });
    await col.createIndex({ categoryPath: 1 });
    await col.createIndex({ title: "text", description: "text" }, { default_language: "none" });

    // Người đăng: lấy user bất kỳ, không có thì tạo tài khoản demo.
    let poster = await usersCol.findOne({});
    if (!poster) {
      const passwordHash = await bcrypt.hash("123456", 10);
      const res = await usersCol.insertOne({
        email: "demo@quynhphu.vn",
        name: "Người dân Quỳnh Phụ",
        passwordHash,
        verified: true,
        createdAt: new Date(),
      });
      poster = await usersCol.findOne({ _id: res.insertedId });
      console.log("• Đã tạo user demo: demo@quynhphu.vn / 123456");
    }
    const postedBy = poster!._id!;
    const postedByName = poster!.name;

    let ok = 0;
    const seenSlugs: string[] = [];
    for (const p of POSTS) {
      const cat = await cats.findOne({ module: MODULE, path: p.categoryPath });
      if (!cat) {
        console.warn(`  ⚠ Bỏ qua "${p.slug}": chưa có danh mục ${p.categoryPath} (chạy seed:categories trước).`);
        continue;
      }

      const created = new Date(Date.now() - p.daysAgo * 86400000);
      // Các trường $set (không gồm createdAt — để tránh xung đột với $setOnInsert).
      const fields: Omit<LostFoundDoc, "_id" | "createdAt"> = {
        kind: p.kind,
        slug: p.slug,
        title: p.title,
        description: p.description,
        categoryId: cat._id!,
        categorySlug: cat.slug,
        categoryName: cat.name,
        categoryPath: cat.path,
        images: p.images,
        location: { wardSlug: slugify(p.ward.replace(/^(Thị trấn|Xã)\s+/, "")) },
        occurredAt: new Date(p.occurredAt),
        contact: p.contact,
        reward: p.reward,
        postedBy,
        postedByName,
        status: "open",
        approved: p.approved,
        verified: false,
        featured: false,
        views: 0,
        active: true,
        updatedAt: new Date(),
        resolvedAt: null,
      };

      await col.updateOne(
        { slug: p.slug },
        {
          $set: fields,
          $setOnInsert: { createdAt: created },
        },
        { upsert: true },
      );
      seenSlugs.push(p.slug);
      ok++;
    }

    // Prune các tin demo cũ (chỉ những slug nằm trong tập demo này).
    const allSlugs = POSTS.map((p) => p.slug);
    const pruned = await col.deleteMany({
      slug: { $in: allSlugs, $nin: seenSlugs },
    });

    console.log(`✓ Tìm đồ (tim-do)     : ${POSTS.filter((p) => p.kind === "tim-do").length}`);
    console.log(`✓ Nhặt được (nhat-duoc): ${POSTS.filter((p) => p.kind === "nhat-duoc").length}`);
    console.log(`✓ Đã duyệt public      : ${POSTS.filter((p) => p.approved).length}/${ok}`);
    if (pruned.deletedCount) console.log(`  (đã dọn ${pruned.deletedCount} tin demo cũ)`);
    console.log(`\n✅ Đã seed ${ok} tin vào "${dbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌ Seed thất bại:", err);
  process.exit(1);
});
