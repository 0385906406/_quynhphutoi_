// Seed danh mục phân cấp cho các phân hệ: Dịch vụ công, Tiện ích, Tìm đồ rơi.
// Idempotent — upsert theo (module, path), chạy lại nhiều lần không nhân đôi.
//
// Cách chạy (trong thư mục web/):
//   npm run seed:categories
// hoặc trực tiếp:
//   node --experimental-strip-types --env-file=.env.local seeds/categories.ts
//   npx tsx seeds/categories.ts
//
// File tự kết nối MongoDB (đọc MONGODB_URI / MONGODB_DB như lib/db.ts) nên
// chạy được độc lập, không cần dựng Next.

import { MongoClient, ObjectId } from "mongodb";
import type { CategoryDoc } from "../lib/categories"; // chỉ lấy kiểu — bị xoá khi chạy

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";

// ---- Cấu trúc seed: cây lồng nhau, chỉ cần slug + name (+ icon/href/desc) ----
type SeedNode = {
  slug: string;
  name: string;
  icon?: string;
  href?: string;          // liên kết tới trang — khớp dữ liệu navbar (lib/nav.ts)
  description?: string;
  children?: SeedNode[];
};

const MODULES: { module: string; label: string; tree: SeedNode[] }[] = [
  {
    module: "dich-vu-cong",
    label: "Dịch vụ công",
    // Cấp 1 khớp NAV_TREE > "Dịch vụ công" trong lib/nav.ts (name/href/desc/icon),
    // cấp 2 mở rộng từ chính phần mô tả của mỗi mục.
    tree: [
      {
        slug: "truong-hoc", name: "Trường học", icon: "school", href: "/truong-hoc",
        description: "Trường học theo xã & cấp học",
        children: [
          { slug: "mam-non", name: "Mầm non" },
          { slug: "tieu-hoc", name: "Tiểu học" },
          { slug: "thcs", name: "Trung học cơ sở" },
          { slug: "thpt", name: "Trung học phổ thông" },
        ],
      },
      {
        slug: "y-te", name: "Y tế", icon: "health", href: "/y-te",
        description: "Bệnh viện, trạm y tế, phòng khám",
        children: [
          { slug: "benh-vien", name: "Bệnh viện" },
          { slug: "tram-y-te", name: "Trạm y tế" },
          { slug: "phong-kham", name: "Phòng khám" },
        ],
      },
      {
        slug: "giao-thong", name: "Giao thông", icon: "bus", href: "/giao-thong",
        description: "Tuyến xe, lộ trình, bến đón",
        children: [
          { slug: "tuyen-xe", name: "Tuyến xe" },
          { slug: "lo-trinh", name: "Lộ trình" },
          { slug: "ben-don", name: "Bến đón" },
        ],
      },
    ],
  },
  {
    module: "tien-ich",
    label: "Tiện ích",
    // Khớp NAV_TREE > "Tiện ích" (giao-thong đã chuyển sang Dịch vụ công như navbar).
    tree: [
      {
        slug: "viec-lam", name: "Việc làm", icon: "job", href: "/viec-lam",
        description: "Tin tuyển dụng địa phương",
        children: [
          { slug: "tuyen-dung", name: "Tin tuyển dụng" },
          { slug: "tim-viec", name: "Người tìm việc" },
        ],
      },
      {
        slug: "cho-mua-ban", name: "Chợ & Mua bán", icon: "market", href: "/cho-mua-ban",
        description: "Lịch chợ phiên, đặc sản, rao vặt",
        children: [
          { slug: "rao-vat", name: "Rao vặt" },
          { slug: "dac-san", name: "Đặc sản địa phương" },
          { slug: "lich-cho-phien", name: "Lịch chợ phiên" },
        ],
      },
    ],
  },
  {
    module: "tim-do-roi",
    label: "Tìm đồ rơi",
    tree: [
      {
        slug: "giay-to", name: "Giấy tờ tuỳ thân", icon: "id-card",
        children: [
          { slug: "cccd", name: "Căn cước công dân" },
          { slug: "giay-phep-lai-xe", name: "Giấy phép lái xe" },
          { slug: "the-bhyt", name: "Thẻ bảo hiểm y tế" },
          { slug: "giay-to-khac", name: "Giấy tờ khác" },
        ],
      },
      {
        slug: "vi-tai-san", name: "Ví & Tài sản", icon: "wallet",
        children: [
          { slug: "vi-tien", name: "Ví tiền" },
          { slug: "dien-thoai", name: "Điện thoại" },
          { slug: "trang-suc", name: "Trang sức" },
          { slug: "chia-khoa", name: "Chìa khoá" },
        ],
      },
      {
        slug: "phuong-tien", name: "Phương tiện", icon: "bike",
        children: [
          { slug: "xe-may", name: "Xe máy" },
          { slug: "xe-dap", name: "Xe đạp" },
        ],
      },
      {
        slug: "thu-cung", name: "Thú cưng", icon: "paw",
        children: [
          { slug: "cho", name: "Chó" },
          { slug: "meo", name: "Mèo" },
        ],
      },
      { slug: "khac", name: "Khác", icon: "dots" },
    ],
  },
];

// ---- Upsert đệ quy: tự tính path / ancestors / depth từ cha ----
// Gom mọi path đã seed vào `seenPaths` để prune node thừa sau đó.
async function seedTree(
  col: import("mongodb").Collection<CategoryDoc>,
  module: string,
  nodes: SeedNode[],
  parent: CategoryDoc | null,
  seenPaths: string[],
) {
  let order = 0;
  for (const n of nodes) {
    const path = `${parent ? parent.path : ""}/${n.slug}`;
    const now = new Date();
    const doc = await col.findOneAndUpdate(
      { module, path },
      {
        $set: {
          name: n.name,
          parentId: parent ? parent._id! : null,
          ancestors: parent ? [...parent.ancestors, parent._id!] : [],
          depth: parent ? parent.depth + 1 : 0,
          order: order++,
          icon: n.icon,
          href: n.href,
          description: n.description,
          active: true,
          updatedAt: now,
        },
        $setOnInsert: { module, slug: n.slug, path, createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
    seenPaths.push(path);
    if (n.children?.length) {
      await seedTree(col, module, n.children, doc as CategoryDoc, seenPaths);
    }
  }
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection<CategoryDoc>("categories");
    await col.createIndex({ module: 1, path: 1 }, { unique: true });
    await col.createIndex({ module: 1, parentId: 1, order: 1 });
    await col.createIndex({ ancestors: 1 });

    let total = 0;
    for (const m of MODULES) {
      const seenPaths: string[] = [];
      await seedTree(col, m.module, m.tree, null, seenPaths);
      // Prune: xoá node cũ của module không còn trong cây seed (seed là nguồn chuẩn).
      const pruned = await col.deleteMany({ module: m.module, path: { $nin: seenPaths } });
      total += seenPaths.length;
      const extra = pruned.deletedCount ? ` (đã dọn ${pruned.deletedCount} node cũ)` : "";
      console.log(`✓ ${m.label} (${m.module}): ${seenPaths.length} danh mục${extra}`);
    }
    console.log(`\n✅ Đã seed ${total} danh mục vào "${dbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌ Seed thất bại:", err);
  // eslint-disable-next-line no-undef
  process.exit(1);
});
