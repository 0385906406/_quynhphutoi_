// Giá vàng (API công khai của PNJ, gồm cả vàng miếng SJC) & tỷ giá (XML chính thức của Vietcombank).
const GOLD_URL = "https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00";
const FX_URL = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx";
const FETCH_TIMEOUT_MS = 8000;

export type GoldRow = { code: string; name: string; buy: number; sell: number }; // đồng/lượng
export type GoldData = { rows: GoldRow[]; updatedAt: string };

export type FxRow = { code: string; name: string; buy: number | null; transfer: number | null; sell: number | null };
export type FxData = { rows: FxRow[]; updatedAt: string };

// PNJ trả giá theo đơn vị nghìn đồng/chỉ → ×10.000 = đồng/lượng (1 lượng = 10 chỉ).
export async function getGoldPrices(): Promise<GoldData> {
  const res = await fetch(GOLD_URL, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`PNJ ${res.status}`);
  const json = (await res.json()) as { data?: { masp: string; tensp: string; giamua: number; giaban: number }[]; updateDate?: string };
  const rows = (json.data ?? [])
    .filter((r) => r.giamua > 0 && r.giaban > 0)
    .map((r) => ({ code: r.masp, name: r.tensp, buy: r.giamua * 10_000, sell: r.giaban * 10_000 }));
  return { rows, updatedAt: json.updateDate ?? "" };
}

const FX_NAMES: Record<string, string> = {
  USD: "Đô la Mỹ", EUR: "Euro", JPY: "Yên Nhật", KRW: "Won Hàn Quốc", CNY: "Nhân dân tệ",
  GBP: "Bảng Anh", AUD: "Đô la Úc", SGD: "Đô la Singapore", THB: "Baht Thái", CAD: "Đô la Canada",
  CHF: "Franc Thuỵ Sĩ", HKD: "Đô la Hồng Kông", TWD: "Đô la Đài Loan", MYR: "Ringgit Malaysia",
  RUB: "Rúp Nga", INR: "Rupee Ấn Độ", DKK: "Krone Đan Mạch", NOK: "Krone Na Uy", SEK: "Krona Thuỵ Điển",
  KWD: "Dinar Kuwait", SAR: "Riyal Ả Rập Xê Út",
};

const num = (s: string) => (s && s !== "-" ? Number(s.replace(/,/g, "")) : null);

// Vietcombank yêu cầu tối đa 1 lần / 5 phút → cache 10 phút.
export async function getExchangeRates(): Promise<FxData> {
  const res = await fetch(FX_URL, {
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`VCB ${res.status}`);
  const xml = await res.text();
  const rows: FxRow[] = [];
  for (const m of xml.matchAll(/<Exrate\s+([^/]*)\/>/g)) {
    const attr = (k: string) => m[1].match(new RegExp(`${k}="([^"]*)"`))?.[1]?.trim() ?? "";
    const code = attr("CurrencyCode");
    rows.push({ code, name: FX_NAMES[code] ?? attr("CurrencyName"), buy: num(attr("Buy")), transfer: num(attr("Transfer")), sell: num(attr("Sell")) });
  }
  return { rows, updatedAt: vcbDateToVi(xml.match(/<DateTime>([^<]*)<\/DateTime>/)?.[1] ?? "") };
}

// "11/24/2026 1:02:02 PM" (kiểu Mỹ) → "24/11/2026 13:02"
function vcbDateToVi(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return s;
  const [, mo, d, y, hRaw, min, ap] = m;
  let h = Number(hRaw) % 12;
  if (!ap) h = Number(hRaw);
  else if (ap.toUpperCase() === "PM") h += 12;
  return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y} ${String(h).padStart(2, "0")}:${min}`;
}

// Thứ tự ưu tiên hiển thị: ngoại tệ người dân hay dùng (lao động/du học Hàn, Nhật, Đài, Trung).
export const FX_PRIORITY = ["USD", "EUR", "JPY", "KRW", "CNY", "GBP", "AUD", "SGD", "THB", "CAD", "CHF", "HKD"];

export function sortFx(rows: FxRow[]): FxRow[] {
  const rank = (c: string) => (FX_PRIORITY.indexOf(c) + 1 || 99);
  return [...rows].sort((a, b) => rank(a.code) - rank(b.code));
}

// Từ 1.000 đ trở lên làm tròn tới đồng cho dễ đọc; số nhỏ (Yên, Won…) luôn đủ 2 số lẻ ("20,00") để
// cột mua/bán thẳng hàng. Khoảng trắng không ngắt dòng để "đ" luôn dính liền với số.
export const fmtVnd = (n: number | null) => {
  if (n === null) return "—";
  const digits = n >= 1000 ? 0 : 2;
  return `${n.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits })} đ`;
};
