// Sổ số Việt Nam API - Fetch từ GitHub (daiduong-eth/vietnam-lottery-xsmb)

export type LotteryRegion = "xsmb" | "xsmn" | "xsmt";

export interface LotteryData {
  date: string;
  region: LotteryRegion;
  prizes: {
    first?: string;
    second?: string[];
    third?: string[];
    fourth?: string[];
    fifth?: string[];
    sixth?: string[];
    seventh?: string[];
    eighth?: string[];
  };
  updatedAt: string;
}

const GITHUB_RAW = "https://raw.githubusercontent.com";

// Mock data (fallback khi API không available)
const MOCK_LOTTERY: Record<LotteryRegion, LotteryData> = {
  xsmb: {
    date: new Date().toISOString().split("T")[0],
    region: "xsmb",
    prizes: {
      first: "12345",
      second: ["23456", "34567"],
      third: ["45678", "56789", "67890"],
    },
    updatedAt: new Date().toISOString(),
  },
  xsmn: {
    date: new Date().toISOString().split("T")[0],
    region: "xsmn",
    prizes: {
      first: "98765",
      second: ["87654", "76543"],
      third: ["65432", "54321"],
    },
    updatedAt: new Date().toISOString(),
  },
  xsmt: {
    date: new Date().toISOString().split("T")[0],
    region: "xsmt",
    prizes: {
      first: "55555",
      second: ["44444", "33333"],
      third: ["22222", "11111"],
    },
    updatedAt: new Date().toISOString(),
  },
};

export async function getLotteryResults(region: LotteryRegion): Promise<LotteryData> {
  try {
    // TODO: Fetch từ GitHub hoặc API
    // const url = `${GITHUB_RAW}/daiduong-eth/vietnam-lottery-xsmb/master/data/${region}.json`;
    // const response = await fetch(url, { cache: "no-store" });
    // if (!response.ok) throw new Error(`API error: ${response.status}`);
    // return response.json();

    // Fallback: Mock data
    return {
      ...MOCK_LOTTERY[region],
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Lottery API Error - ${region}]`, error);
    return MOCK_LOTTERY[region];
  }
}

export async function getAllLotteryResults(): Promise<Record<LotteryRegion, LotteryData>> {
  const [xsmb, xsmn, xsmt] = await Promise.all([
    getLotteryResults("xsmb"),
    getLotteryResults("xsmn"),
    getLotteryResults("xsmt"),
  ]);
  return { xsmb, xsmn, xsmt };
}
