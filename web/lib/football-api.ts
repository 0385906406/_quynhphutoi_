// Bóng đá Live API - API-Sports (api-football.com)

export interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  status: "LIVE" | "NOT_STARTED" | "FINISHED" | "PAUSED";
  minute?: number;
  league: string;
  kickoff: string; // ISO timestamp
}

// Mock data
const MOCK_MATCHES: FootballMatch[] = [
  {
    id: "1",
    homeTeam: "Hà Nội FC",
    awayTeam: "HAGL",
    homeGoals: 2,
    awayGoals: 1,
    status: "LIVE",
    minute: 45,
    league: "V.League 1",
    kickoff: new Date().toISOString(),
  },
  {
    id: "2",
    homeTeam: "SHB Đà Nẵng",
    awayTeam: "Phố Hiến",
    homeGoals: 1,
    awayGoals: 0,
    status: "FINISHED",
    league: "V.League 1",
    kickoff: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    homeTeam: "Topenland Tây Ninh",
    awayTeam: "Thanh Hóa",
    homeGoals: 0,
    awayGoals: 0,
    status: "NOT_STARTED",
    league: "V.League 1",
    kickoff: new Date(Date.now() + 7200000).toISOString(),
  },
];

export async function getTodayMatches(): Promise<FootballMatch[]> {
  try {
    // TODO: Fetch từ API-Sports hoặc SportAPI.ai
    // Hiện tại dùng mock data
    return MOCK_MATCHES;
  } catch (error) {
    console.error("[Football API Error]", error);
    return MOCK_MATCHES;
  }
}

export function getMatchStatus(match: FootballMatch): string {
  if (match.status === "LIVE") return `🔴 ${match.minute}'`;
  if (match.status === "FINISHED") return "✓ Kết thúc";
  if (match.status === "PAUSED") return "⏸ Tạm dừng";
  return "🕐 Chưa bắt đầu";
}

export function getStatusColor(status: FootballMatch["status"]): string {
  switch (status) {
    case "LIVE":
      return "#10B981"; // green
    case "FINISHED":
      return "#6B7280"; // gray
    default:
      return "#3B82F6"; // blue
  }
}
