import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { getActivityLogs, type LogFilter, type ActivityCategory } from "@/lib/activity-log";

export async function GET(req: Request) {
  const g = await requirePerm("hoat-dong", "view");
  if (g instanceof NextResponse) return g;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "50", 10)));

  const filter: LogFilter = {};
  const cat = url.searchParams.get("category");
  if (cat === "auth" || cat === "admin" || cat === "user") filter.category = cat as ActivityCategory;
  const userId = url.searchParams.get("userId");
  if (userId) filter.userId = userId;
  const action = url.searchParams.get("action");
  if (action) filter.action = action;
  const success = url.searchParams.get("success");
  if (success === "true") filter.success = true;
  if (success === "false") filter.success = false;
  const from = url.searchParams.get("from");
  if (from) filter.dateFrom = new Date(from);
  const to = url.searchParams.get("to");
  if (to) filter.dateTo = new Date(to);

  const result = await getActivityLogs(filter, page, pageSize);
  return NextResponse.json({ ...result, page, pageSize });
}
