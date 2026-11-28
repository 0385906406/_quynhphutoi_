// Admin: thống kê truy cập.
//   GET /api/admin/traffic?view=log|ip|summary|top&from=YYYY-MM-DD&to=YYYY-MM-DD&ip=&device=&path=&q=&page=&pageSize=
import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/admin-guard";
import { groupByIp, listVisits, liveVisitors, topArticles, trafficSummary, type TrafficFilter } from "@/lib/visits";
import { vnDateKey } from "@/lib/daily/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await requirePerm("thong-ke", "view");
  if (g instanceof NextResponse) return g;

  const sp = new URL(req.url).searchParams;
  const view = sp.get("view") ?? "summary";
  const today = vnDateKey();
  const from = sp.get("from") || today, to = sp.get("to") || today;
  const filter: TrafficFilter = {
    from, to,
    ip: sp.get("ip") || undefined, device: sp.get("device") || undefined,
    path: sp.get("path") || undefined, q: sp.get("q")?.trim() || undefined,
  };
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(sp.get("pageSize") || "30", 10) || 30));

  if (view === "live") return NextResponse.json({ live: await liveVisitors(5) });
  if (view === "top") return NextResponse.json(await topArticles(from, to, 30));
  if (view === "log") return NextResponse.json({ ...(await listVisits(filter, page, pageSize)), page, pageSize });
  if (view === "ip") return NextResponse.json({ ...(await groupByIp(filter, page, pageSize)), page, pageSize });
  return NextResponse.json(await trafficSummary(filter));
}
