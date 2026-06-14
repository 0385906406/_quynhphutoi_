// Danh sách ngành nghề cho phân hệ Việc làm — client-safe (KHÔNG import DB).
export type Industry = { slug: string; name: string };

export const INDUSTRIES: Industry[] = [
  { slug: "nong-nghiep", name: "Nông nghiệp - Thủy sản" },
  { slug: "san-xuat", name: "Sản xuất - Công nghiệp" },
  { slug: "may-mac", name: "May mặc - Da giày" },
  { slug: "co-khi-dien", name: "Cơ khí - Điện - Điện tử" },
  { slug: "xay-dung", name: "Xây dựng" },
  { slug: "kinh-doanh", name: "Bán hàng - Kinh doanh" },
  { slug: "dich-vu", name: "Dịch vụ - Nhà hàng - Khách sạn" },
  { slug: "van-tai", name: "Vận tải - Kho bãi" },
  { slug: "van-phong", name: "Hành chính - Văn phòng" },
  { slug: "ke-toan", name: "Kế toán - Tài chính" },
  { slug: "giao-duc", name: "Giáo dục - Đào tạo" },
  { slug: "y-te", name: "Y tế - Chăm sóc sức khỏe" },
  { slug: "cntt", name: "Công nghệ thông tin" },
  { slug: "lao-dong-pho-thong", name: "Lao động phổ thông" },
  { slug: "khac", name: "Ngành nghề khác" },
];

export const industryName = (slug: string) =>
  INDUSTRIES.find((i) => i.slug === slug)?.name ?? "Ngành nghề khác";

// Loại hình công việc.
export type JobType = "toan-thoi-gian" | "ban-thoi-gian" | "thoi-vu" | "thuc-tap";
export const JOB_TYPES: { slug: JobType; name: string }[] = [
  { slug: "toan-thoi-gian", name: "Toàn thời gian" },
  { slug: "ban-thoi-gian", name: "Bán thời gian" },
  { slug: "thoi-vu", name: "Thời vụ" },
  { slug: "thuc-tap", name: "Thực tập" },
];
export const jobTypeName = (slug: string) =>
  JOB_TYPES.find((t) => t.slug === slug)?.name ?? "Toàn thời gian";
