// Bật/tắt & tinh chỉnh các khối MỚI của trang chủ (Thông tin hôm nay, Truy cập nhanh, số liệu, lịch chợ,
// dịch vụ, đường dây nóng). Lưu 1 document _id="blocks" trong collection "home_blocks".
// (Các khối Tin tức / Việc làm / Tìm đồ rơi / Mua bán vẫn cấu hình ở lib/home-sections.ts.)
import { getDb } from "@/lib/db";
import { LEAGUES } from "@/lib/daily/football";

export type HomeBlocksConfig = {
  daily: boolean;      // cả khối "Thông tin hôm nay"
  gold: boolean;       // thẻ giá vàng
  fx: boolean;         // thẻ tỷ giá
  lottery: boolean;    // thẻ xổ số miền Bắc
  football: boolean;   // thẻ bóng đá
  weather: boolean;    // ô thời tiết ở đầu khối
  leagues: string[];   // mã giải bóng đá hiển thị (lib/daily/football LEAGUES)
  matches: number;     // số trận hiện ở trang chủ (3–10)
  quick: boolean;      // lưới "Truy cập nhanh"
  kpi: boolean;        // dải số liệu địa phương
  market: boolean;     // lịch chợ phiên
  services: boolean;   // tiện ích & dịch vụ thiết yếu
  hotline: boolean;    // đường dây nóng
};

export const ALL_LEAGUE_CODES: string[] = LEAGUES.map((l) => l.code);

export const DEFAULT_BLOCKS: HomeBlocksConfig = {
  daily: true, gold: true, fx: true, lottery: true, football: true, weather: true,
  leagues: ALL_LEAGUE_CODES, matches: 6,
  quick: true, kpi: true, market: true, services: true, hotline: true,
};

const BOOLS = ["daily", "gold", "fx", "lottery", "football", "weather", "quick", "kpi", "market", "services", "hotline"] as const;

async function col() {
  return (await getDb()).collection<{ _id: string; config: Partial<HomeBlocksConfig> }>("home_blocks");
}

function clean(input: Partial<HomeBlocksConfig>, base: HomeBlocksConfig): HomeBlocksConfig {
  const out: HomeBlocksConfig = { ...base };
  for (const k of BOOLS) if (typeof input[k] === "boolean") out[k] = input[k] as boolean;
  if (Array.isArray(input.leagues)) {
    const ok = input.leagues.filter((c): c is string => typeof c === "string" && ALL_LEAGUE_CODES.includes(c));
    out.leagues = ALL_LEAGUE_CODES.filter((c) => ok.includes(c)); // giữ thứ tự chuẩn
  }
  if (typeof input.matches === "number" && Number.isFinite(input.matches)) out.matches = Math.min(10, Math.max(3, Math.round(input.matches)));
  return out;
}

export async function getHomeBlocks(): Promise<HomeBlocksConfig> {
  try {
    const doc = await (await col()).findOne({ _id: "blocks" });
    return clean(doc?.config ?? {}, DEFAULT_BLOCKS);
  } catch {
    return DEFAULT_BLOCKS;
  }
}

export async function setHomeBlocks(input: Partial<HomeBlocksConfig>): Promise<HomeBlocksConfig> {
  const next = clean(input, await getHomeBlocks());
  await (await col()).updateOne({ _id: "blocks" }, { $set: { config: next } }, { upsert: true });
  return next;
}
