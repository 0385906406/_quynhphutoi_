// Lịch sử truy cập (theo IP + thiết bị) và lượt đọc bài theo ngày — cho trang Admin → Thống kê truy cập.
//
//  • visits            : mỗi lượt xem trang của NGƯỜI THẬT (đã loại bot). Tự xoá sau VISIT_TTL_DAYS ngày
//                        (IP là dữ liệu cá nhân → chỉ giữ đủ dùng, không giữ vĩnh viễn).
//  • news_views_daily  : số lượt đọc mỗi bài theo ngày (giờ Việt Nam) — nguồn cho "bài nào đọc nhiều hôm nay / tháng này".
import { createHash } from "node:crypto";
import type { Filter } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/db";
import { vnDateKey } from "@/lib/daily/time";

const VISIT_TTL_DAYS = Number(process.env.VISIT_TTL_DAYS || "90");

// ───────────────────────── Nhận diện thiết bị ─────────────────────────
export type DeviceKind = "mobile" | "tablet" | "desktop";
export type DeviceInfo = { kind: DeviceKind; os: string; browser: string; model: string };

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|facebot|preview|headless|lighthouse|pagespeed|curl\/|wget|python|axios|go-http|java\/|okhttp|monitor|uptime|pingdom|vercel|node-fetch|scrapy|httpclient/i;
export function isBot(ua: string | null | undefined): boolean {
  return !ua || BOT.test(ua);
}

export function parseUa(ua: string): DeviceInfo {
  const kind: DeviceKind = /ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)) ? "tablet"
    : /mobi|iphone|ipod|android/i.test(ua) ? "mobile" : "desktop";
  const os = /windows nt/i.test(ua) ? "Windows"
    : /android/i.test(ua) ? "Android"
    : /iphone|ipad|ipod/i.test(ua) ? "iOS"
    : /mac os x|macintosh/i.test(ua) ? "macOS"
    : /cros/i.test(ua) ? "ChromeOS"
    : /linux/i.test(ua) ? "Linux" : "Khác";
  const browser = /zalo/i.test(ua) ? "Zalo"
    : /fban|fbav|fb_iab/i.test(ua) ? "Facebook"
    : /coc_coc/i.test(ua) ? "Cốc Cốc"
    : /edg(e|a|ios)?\//i.test(ua) ? "Edge"
    : /opr\/|opera/i.test(ua) ? "Opera"
    : /samsungbrowser/i.test(ua) ? "Samsung Internet"
    : /firefox|fxios/i.test(ua) ? "Firefox"
    : /chrome|crios/i.test(ua) ? "Chrome"
    : /safari/i.test(ua) ? "Safari" : "Khác";
  const model = /iphone/i.test(ua) ? "iPhone" : /ipad/i.test(ua) ? "iPad"
    : (/android [\d.]+; ([^;)]+)/i.exec(ua)?.[1]?.replace(/ build.*$/i, "").trim() ?? "");
  return { kind, os, browser, model: model.slice(0, 40) };
}

// ───────────────────────── Ghi nhận ─────────────────────────
export type VisitDoc = {
  ip: string; vid: string; path: string; ref?: string; userId?: string;
  device: DeviceKind; os: string; browser: string; model: string; ua: string; createdAt: Date;
};

async function visitsCol() {
  const c = (await getDb()).collection<VisitDoc>("visits");
  await ensureIndexes("visits", () => Promise.all([
    c.createIndex({ createdAt: 1 }, { expireAfterSeconds: VISIT_TTL_DAYS * 86400 }),
    c.createIndex({ ip: 1, createdAt: -1 }),
    c.createIndex({ path: 1, createdAt: -1 }),
  ]));
  return c;
}

export async function recordVisit(v: { ip: string; ua: string; path: string; ref?: string; userId?: string }) {
  const d = parseUa(v.ua);
  const vid = createHash("sha1").update(`${v.ip}|${v.ua}`).digest("hex").slice(0, 12);
  await (await visitsCol()).insertOne({
    ip: v.ip, vid, path: v.path, ref: v.ref, userId: v.userId,
    device: d.kind, os: d.os, browser: d.browser, model: d.model, ua: v.ua.slice(0, 300), createdAt: new Date(),
  });
}

type DailyView = { _id: string; slug: string; day: string; views: number };
async function dailyCol() {
  const c = (await getDb()).collection<DailyView>("news_views_daily");
  await ensureIndexes("news_views_daily", () => Promise.all([c.createIndex({ day: 1, views: -1 }), c.createIndex({ slug: 1, day: 1 })]));
  return c;
}
export async function recordArticleView(slug: string) {
  const day = vnDateKey();
  await (await dailyCol()).updateOne({ _id: `${slug}|${day}` }, { $inc: { views: 1 }, $setOnInsert: { slug, day } }, { upsert: true });
}

// ───────────────────────── Truy vấn (admin) ─────────────────────────
// from/to: khoá ngày "YYYY-MM-DD" theo giờ Việt Nam (gồm cả hai đầu).
const startOf = (k: string) => new Date(`${k}T00:00:00+07:00`);
const endOf = (k: string) => new Date(`${k}T23:59:59.999+07:00`);
const validKey = (k?: string) => (k && /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : undefined);

export type TrafficFilter = { from?: string; to?: string; ip?: string; device?: string; path?: string; q?: string };

function visitMatch(f: TrafficFilter): Filter<VisitDoc> {
  const m: Filter<VisitDoc> = {};
  const from = validKey(f.from), to = validKey(f.to);
  if (from || to) m.createdAt = { ...(from ? { $gte: startOf(from) } : {}), ...(to ? { $lte: endOf(to) } : {}) };
  if (f.ip) m.ip = f.ip.slice(0, 64);
  if (f.device === "mobile" || f.device === "tablet" || f.device === "desktop") m.device = f.device;
  if (f.path) m.path = { $regex: `^${f.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100)}` };
  if (f.q) {
    const rx = { $regex: f.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60), $options: "i" };
    m.$or = [{ ip: rx }, { path: rx }, { browser: rx }, { os: rx }, { model: rx }];
  }
  return m;
}

export type VisitRow = Omit<VisitDoc, "createdAt" | "ua"> & { id: string; createdAt: string };

export async function listVisits(f: TrafficFilter, page: number, size: number) {
  const c = await visitsCol();
  const match = visitMatch(f);
  const [docs, total] = await Promise.all([
    c.find(match).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).toArray(),
    c.countDocuments(match),
  ]);
  const rows: VisitRow[] = docs.map((d) => ({ ip: d.ip, vid: d.vid, path: d.path, ref: d.ref, userId: d.userId, device: d.device, os: d.os, browser: d.browser, model: d.model, id: String(d._id), createdAt: d.createdAt.toISOString() }));
  return { rows, total };
}

export type IpRow = {
  ip: string; views: number; first: string; last: string;
  devices: { device: DeviceKind; os: string; browser: string; model: string }[]; deviceCount: number; pageCount: number;
};
export async function groupByIp(f: TrafficFilter, page: number, size: number) {
  const c = await visitsCol();
  const [res] = await c.aggregate<{ rows: (IpRow & { _id: string; firstD: Date; lastD: Date; vids: string[]; pages: string[] })[]; total: { n: number }[] }>([
    { $match: visitMatch(f) },
    { $group: { _id: "$ip", views: { $sum: 1 }, firstD: { $min: "$createdAt" }, lastD: { $max: "$createdAt" },
        dev: { $addToSet: { vid: "$vid", device: "$device", os: "$os", browser: "$browser", model: "$model" } }, pages: { $addToSet: "$path" } } },
    { $sort: { lastD: -1 } },
    { $facet: {
        rows: [{ $skip: (page - 1) * size }, { $limit: size }, { $project: { views: 1, firstD: 1, lastD: 1, dev: { $slice: ["$dev", 6] }, deviceCount: { $size: "$dev" }, pageCount: { $size: "$pages" } } }],
        total: [{ $count: "n" }],
    } },
  ]).toArray() as unknown as [{ rows: (Record<string, unknown>)[]; total: { n: number }[] }];
  const rows: IpRow[] = res.rows.map((r) => ({
    ip: String(r._id), views: r.views as number, first: (r.firstD as Date).toISOString(), last: (r.lastD as Date).toISOString(),
    devices: (r.dev as IpRow["devices"]), deviceCount: r.deviceCount as number, pageCount: r.pageCount as number,
  }));
  return { rows, total: res.total[0]?.n ?? 0 };
}

export async function trafficSummary(f: TrafficFilter) {
  const c = await visitsCol();
  const match = visitMatch(f);
  const [r] = await c.aggregate([
    { $match: match },
    { $facet: {
        totals: [{ $group: { _id: null, views: { $sum: 1 }, ips: { $addToSet: "$ip" }, vids: { $addToSet: "$vid" } } }, { $project: { views: 1, ips: { $size: "$ips" }, devices: { $size: "$vids" } } }],
        byDevice: [{ $group: { _id: "$device", n: { $sum: 1 } } }],
        byOs: [{ $group: { _id: "$os", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }],
        byBrowser: [{ $group: { _id: "$browser", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }],
        topPaths: [{ $group: { _id: "$path", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 10 }],
        byHour: [{ $group: { _id: { $hour: { date: "$createdAt", timezone: "+07:00" } }, n: { $sum: 1 } } }],
        refs: [{ $match: { ref: { $exists: true, $nin: ["", null] } } }, { $group: { _id: "$ref", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }],
        loggedIn: [{ $match: { userId: { $exists: true, $nin: ["", null] } } }, { $count: "n" }],
        daily: [{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, views: { $sum: 1 }, ips: { $addToSet: "$ip" } } },
                { $project: { views: 1, ips: { $size: "$ips" } } }, { $sort: { _id: 1 } }],
    } },
  ]).toArray();
  const pick = (a: { _id: string; n: number }[]) => (a ?? []).map((x) => ({ label: x._id, n: x.n }));
  return {
    views: (r.totals[0]?.views as number) ?? 0, ips: (r.totals[0]?.ips as number) ?? 0, devices: (r.totals[0]?.devices as number) ?? 0,
    byDevice: pick(r.byDevice), byOs: pick(r.byOs), byBrowser: pick(r.byBrowser), topPaths: pick(r.topPaths), refs: pick(r.refs),
    byHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, n: (r.byHour as { _id: number; n: number }[]).find((x) => x._id === h)?.n ?? 0 })),
    loggedIn: (r.loggedIn[0]?.n as number) ?? 0,
    daily: (r.daily as { _id: string; views: number; ips: number }[]).map((d) => ({ date: d._id, views: d.views, ips: d.ips })),
  };
}

export type TopArticle = { slug: string; title: string; category: string; views: number; total: number; today: number };

// Bài đọc nhiều nhất trong khoảng ngày [from, to] (khoá ngày giờ VN).
export async function topArticles(from: string, to: string, limit = 30) {
  const f = validKey(from) ?? vnDateKey(), t = validKey(to) ?? vnDateKey();
  const c = await dailyCol();
  const today = vnDateKey();
  const [res] = await c.aggregate([
    { $match: { day: { $gte: f, $lte: t } } },
    { $facet: {
        top: [{ $group: { _id: "$slug", views: { $sum: "$views" }, today: { $sum: { $cond: [{ $eq: ["$day", today] }, "$views", 0] } } } }, { $sort: { views: -1 } }, { $limit: limit }],
        daily: [{ $group: { _id: "$day", total: { $sum: "$views" } } }, { $sort: { _id: 1 } }],
        sum: [{ $group: { _id: null, views: { $sum: "$views" }, articles: { $addToSet: "$slug" } } }, { $project: { views: 1, articles: { $size: "$articles" } } }],
    } },
  ]).toArray();
  const slugs = (res.top as { _id: string }[]).map((x) => x._id);
  const docs = await (await getDb()).collection("articles")
    .find({ slug: { $in: slugs } }, { projection: { slug: 1, title: 1, category: 1, views: 1 } }).toArray();
  const by = new Map(docs.map((d) => [d.slug as string, d]));
  const items: TopArticle[] = (res.top as { _id: string; views: number; today: number }[]).map((x) => ({
    slug: x._id, title: (by.get(x._id)?.title as string) ?? x._id, category: (by.get(x._id)?.category as string) ?? "",
    views: x.views, today: x.today, total: (by.get(x._id)?.views as number) ?? 0,
  }));
  return {
    items,
    totalViews: (res.sum[0]?.views as number) ?? 0,
    articles: (res.sum[0]?.articles as number) ?? 0,
    daily: (res.daily as { _id: string; total: number }[]).map((d) => ({ date: d._id, total: d.total })),
  };
}

// Số người đang online (IP khác nhau trong N phút gần nhất).
export async function liveVisitors(minutes = 5) {
  const c = await visitsCol();
  const ips = await c.distinct("ip", { createdAt: { $gte: new Date(Date.now() - minutes * 60_000) } });
  return ips.length;
}

// Tóm tắt cho Bảng điều khiển: hôm nay vs hôm qua, chuỗi 14 ngày, bài đọc nhiều hôm nay.
export async function trafficOverview() {
  const today = vnDateKey();
  const shiftKey = (k: string, d: number) => new Date(Date.parse(k + "T00:00:00Z") + d * 86400_000).toISOString().slice(0, 10);
  const from = shiftKey(today, -13);
  const [sum, live, top] = await Promise.all([
    trafficSummary({ from, to: today }),
    liveVisitors(5),
    topArticles(today, today, 5),
  ]);
  const by = new Map(sum.daily.map((d) => [d.date, d]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const k = shiftKey(from, i); const d = by.get(k);
    return { date: k, views: d?.views ?? 0, ips: d?.ips ?? 0 };
  });
  const yesterday = series[12];
  return { today: series[13], yesterday, series, live, topToday: top.items, readsToday: top.totalViews, week: series.slice(7).reduce((s, d) => s + d.views, 0), prevWeek: series.slice(0, 7).reduce((s, d) => s + d.views, 0) };
}
