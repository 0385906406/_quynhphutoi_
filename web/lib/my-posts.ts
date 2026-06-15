// Gom bài đăng của 1 người dùng từ TẤT CẢ phân hệ (tìm đồ rơi / việc làm / mua bán)
// và chuẩn hoá về 1 kiểu chung cho trang Tài khoản.
import { listMyPosts } from "@/lib/lostfound";
import { listMyJobs } from "@/lib/jobs";
import { listMyClassifieds } from "@/lib/classifieds";
import { listMyArticles } from "@/lib/articles";

export type MyPostSection = "tim-do-roi" | "viec-lam" | "mua-ban" | "tin-tuc";
export type MyPostState = "pending" | "active" | "closed" | "hidden";

export type MyPost = {
  section: MyPostSection;
  sectionLabel: string;
  slug: string;
  title: string;
  href: string;
  image: string | null;
  statusLabel: string;
  state: MyPostState;
  views: number;
  createdAt: string; // ISO
};

const SECTION_LABEL: Record<MyPostSection, string> = {
  "tim-do-roi": "Tìm đồ rơi",
  "viec-lam": "Việc làm",
  "mua-ban": "Mua bán",
  "tin-tuc": "Tin tức",
};

const LF_STATUS: Record<string, string> = { open: "Đang hiển thị", matched: "Đã có thông tin", resolved: "Đã trao trả", closed: "Đã đóng" };
const JOB_STATUS: Record<string, string> = { open: "Đang tuyển", closed: "Đã đóng", filled: "Đã tuyển đủ" };
const AD_STATUS: Record<string, string> = { open: "Đang rao", sold: "Đã bán", closed: "Đã đóng" };
const NEWS_STATUS: Record<string, string> = { published: "Đang hiển thị", draft: "Bản nháp" };

// Xác định trạng thái + nhãn hiển thị thống nhất.
function resolve(approved: boolean, active: boolean, status: string, closedSet: string[], labelMap: Record<string, string>): { state: MyPostState; statusLabel: string } {
  if (!active) return { state: "hidden", statusLabel: "Đã ẩn" };
  if (!approved) return { state: "pending", statusLabel: "Chờ duyệt" };
  if (closedSet.includes(status)) return { state: "closed", statusLabel: labelMap[status] ?? "Đã đóng" };
  return { state: "active", statusLabel: labelMap[status] ?? "Đang hiển thị" };
}

export async function getMyPosts(userId: string): Promise<MyPost[]> {
  const [lf, jobs, ads, news] = await Promise.all([listMyPosts(userId), listMyJobs(userId), listMyClassifieds(userId), listMyArticles(userId)]);

  const out: MyPost[] = [];

  for (const d of lf) {
    const r = resolve(d.approved, d.active, d.status, ["resolved", "closed"], LF_STATUS);
    out.push({ section: "tim-do-roi", sectionLabel: SECTION_LABEL["tim-do-roi"], slug: d.slug, title: d.title, href: `/tim-do-roi/${d.slug}`, image: d.images?.[0] ?? null, views: d.views, createdAt: d.createdAt.toISOString(), ...r });
  }
  for (const d of jobs) {
    const r = resolve(d.approved, d.active, d.status, ["closed", "filled"], JOB_STATUS);
    out.push({ section: "viec-lam", sectionLabel: SECTION_LABEL["viec-lam"], slug: d.slug, title: d.title, href: `/viec-lam/${d.slug}`, image: d.images?.[0] ?? null, views: d.views, createdAt: d.createdAt.toISOString(), ...r });
  }
  for (const d of ads) {
    const r = resolve(d.approved, d.active, d.status, ["sold", "closed"], AD_STATUS);
    out.push({ section: "mua-ban", sectionLabel: SECTION_LABEL["mua-ban"], slug: d.slug, title: d.title, href: `/mua-ban/${d.slug}`, image: d.images?.[0] ?? null, views: d.views, createdAt: d.createdAt.toISOString(), ...r });
  }
  for (const d of news) {
    const r = resolve(d.approved !== false, d.active !== false, d.status, [], NEWS_STATUS);
    out.push({ section: "tin-tuc", sectionLabel: SECTION_LABEL["tin-tuc"], slug: d.slug, title: d.title, href: `/tin-tuc/${d.slug}`, image: d.coverImage || null, views: d.views ?? 0, createdAt: d.createdAt.toISOString(), ...r });
  }

  // Mới nhất trước.
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}
