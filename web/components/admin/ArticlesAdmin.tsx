"use client";

// Khu quản trị Tin tức = danh sách bài viết (CRUD). Cấu hình bố cục trang tin tức công khai
// đã chuyển sang "Quản lý trang" → Tin tức → tab "Quản lý trang".
import { ArticleManager } from "@/components/admin/ArticleManager";
import type { ArticleRow } from "@/lib/articles";

export function ArticlesAdmin({ rows, externalEnabled }: {
  rows: ArticleRow[];
  externalEnabled?: boolean;
}) {
  return <ArticleManager initial={rows} externalEnabled={externalEnabled} />;
}
