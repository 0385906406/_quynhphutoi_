// Giá vàng & Tỷ giá API

export interface GoldPrice {
  dealer: "sjc" | "doji" | "pnj";
  buy: number; // VND
  sell: number; // VND
  change?: number; // so với hôm qua
  updatedAt: string;
}

export interface ExchangeRate {
  code: string; // USD, EUR, JPY
  buy: number;
  sell: number;
  change?: number;
  updatedAt: string;
}

// Mock data
const MOCK_GOLD: Record<string, GoldPrice> = {
  sjc: {
    dealer: "sjc",
    buy: 86500000,
    sell: 87000000,
    change: 100000,
    updatedAt: new Date().toISOString(),
  },
  doji: {
    dealer: "doji",
    buy: 86200000,
    sell: 86700000,
    change: 50000,
    updatedAt: new Date().toISOString(),
  },
  pnj: {
    dealer: "pnj",
    buy: 86300000,
    sell: 86800000,
    change: 75000,
    updatedAt: new Date().toISOString(),
  },
};

const MOCK_RATES: ExchangeRate[] = [
  { code: "USD", buy: 24500, sell: 24600, change: 50, updatedAt: new Date().toISOString() },
  { code: "EUR", buy: 26000, sell: 26100, change: -100, updatedAt: new Date().toISOString() },
  { code: "JPY", buy: 165, sell: 166, change: 0, updatedAt: new Date().toISOString() },
  { code: "GBP", buy: 30900, sell: 31050, change: 150, updatedAt: new Date().toISOString() },
];

export async function getGoldPrice(dealer: "sjc" | "doji" | "pnj" = "sjc"): Promise<GoldPrice> {
  try {
    // TODO: Fetch từ GitHub scraper hoặc GoldPrice.dev API
    return MOCK_GOLD[dealer];
  } catch (error) {
    console.error(`[Gold API Error - ${dealer}]`, error);
    return MOCK_GOLD[dealer];
  }
}

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  try {
    // TODO: Fetch từ OpenExchangeRates hoặc Crystal Ball Markets
    return MOCK_RATES;
  } catch (error) {
    console.error("[Exchange Rate API Error]", error);
    return MOCK_RATES;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price);
}

export function getPriceChangeColor(change: number | undefined): string {
  if (!change) return "#6B7280"; // gray
  if (change > 0) return "#10B981"; // green - up
  if (change < 0) return "#EF4444"; // red - down
  return "#6B7280";
}
