// Kết quả xổ số miền Bắc (XSMB) — bộ dữ liệu mở khiemdoan/vietnam-lottery-xsmb-analysis
// (cập nhật tự động hằng ngày). Dùng bản CSV (~1MB) vì bản JSON vượt giới hạn 2MB của Next data cache.
import { vnDateKey, vnMinutesOfDay } from "./time";

const CSV_URL = "https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/main/data/xsmb.csv";
const REVALIDATE_SECONDS = 1800;
const FETCH_TIMEOUT_MS = 10_000;
const DRAW_DONE_MINUTE = 18 * 60 + 35; // quay 18:15, xong khoảng 18:35

export type XsmbDraw = {
  date: string;           // YYYY-MM-DD
  special: string;
  prizes: { label: string; numbers: string[] }[]; // G1 → G7
};

// [cột CSV, nhãn, số chữ số] — số trong CSV mất số 0 đầu ("0" = "0000") nên phải pad lại.
const PRIZE_COLUMNS: { label: string; prefix: string; digits: number }[] = [
  { label: "G1", prefix: "prize1", digits: 5 },
  { label: "G2", prefix: "prize2_", digits: 5 },
  { label: "G3", prefix: "prize3_", digits: 5 },
  { label: "G4", prefix: "prize4_", digits: 4 },
  { label: "G5", prefix: "prize5_", digits: 4 },
  { label: "G6", prefix: "prize6_", digits: 3 },
  { label: "G7", prefix: "prize7_", digits: 2 },
];

const pad = (raw: string | undefined, digits: number) =>
  raw && /^\d+$/.test(raw.trim()) ? raw.trim().padStart(digits, "0") : "—";

function parseCsv(text: string, limit: number): XsmbDraw[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const rows = lines.slice(-limit).reverse();
  return rows.map((line) => {
    const cells = line.split(",");
    const col = (name: string) => cells[header.indexOf(name)];
    const prizes = PRIZE_COLUMNS.map(({ label, prefix, digits }) => ({
      label,
      numbers: header
        .filter((h) => h === prefix || (prefix.endsWith("_") && h.startsWith(prefix)))
        .map((h) => pad(col(h), digits)),
    }));
    return { date: col("date").slice(0, 10), special: pad(col("special"), 5), prizes };
  });
}

export async function getXsmbDraws(limit = 7): Promise<XsmbDraw[]> {
  const res = await fetch(CSV_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`XSMB ${res.status}`);
  return parseCsv(await res.text(), limit);
}

// Kỳ quay hôm nay đã xong nhưng nguồn chưa có → báo "đang cập nhật" thay vì để người xem tưởng là kết quả mới.
export function isTodayPending(latest: XsmbDraw | undefined, now = new Date()): boolean {
  return vnMinutesOfDay(now) >= DRAW_DONE_MINUTE && latest?.date !== vnDateKey(now);
}

// Bảng lô tô: 2 số cuối của mọi giải, gom theo chữ số đầu (0–9).
export function lotoByHead(draw: XsmbDraw): string[][] {
  const heads: string[][] = Array.from({ length: 10 }, () => []);
  const all = [draw.special, ...draw.prizes.flatMap((p) => p.numbers)].filter((n) => n !== "—");
  for (const n of all) {
    const two = n.slice(-2);
    heads[Number(two[0])].push(two[1]);
  }
  return heads.map((tails) => tails.sort());
}
