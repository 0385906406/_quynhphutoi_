// Lịch & kết quả bóng đá — API công khai của ESPN (site.api.espn.com), không cần khoá.
import { vnDateKey, shiftDateKey } from "./time";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const REVALIDATE_SECONDS = 120;
const FETCH_TIMEOUT_MS = 8000;

export const LEAGUES = [
  { code: "uefa.champions", name: "Cúp C1 châu Âu" },
  { code: "eng.1", name: "Ngoại hạng Anh" },
  { code: "esp.1", name: "La Liga" },
  { code: "ita.1", name: "Serie A" },
  { code: "ger.1", name: "Bundesliga" },
  { code: "fra.1", name: "Ligue 1" },
  { code: "uefa.europa", name: "Cúp C2 châu Âu" },
  { code: "afc.champions", name: "AFC Champions League" },
] as const;

export type MatchState = "pre" | "in" | "post";

export type MatchTeam = { name: string; logo?: string; score: string };

export type Match = {
  id: string;
  league: string;
  kickoff: string;        // ISO UTC
  state: MatchState;
  status: string;         // nhãn tiếng Việt: "45'", "Nghỉ giữa hiệp", "Hết giờ", "Hoãn"…
  home: MatchTeam;
  away: MatchTeam;
};

type EspnEvent = {
  id: string;
  date: string;
  status: { displayClock?: string; type: { name: string; state: MatchState; shortDetail?: string } };
  competitions: { competitors: { homeAway: "home" | "away"; score?: string; team: { displayName: string; shortDisplayName?: string; logo?: string } }[] }[];
};

const STATUS_VI: Record<string, string> = {
  STATUS_HALFTIME: "Nghỉ giữa hiệp",
  STATUS_FULL_TIME: "Hết giờ",
  STATUS_FINAL: "Hết giờ",
  STATUS_FINAL_AET: "Hết hiệp phụ",
  STATUS_FINAL_PEN: "Hết luân lưu",
  STATUS_POSTPONED: "Hoãn",
  STATUS_CANCELED: "Huỷ",
  STATUS_ABANDONED: "Bỏ dở",
  STATUS_DELAYED: "Tạm hoãn",
};

function toMatch(e: EspnEvent, league: string): Match | null {
  const teams = e.competitions?.[0]?.competitors ?? [];
  const h = teams.find((t) => t.homeAway === "home");
  const a = teams.find((t) => t.homeAway === "away");
  if (!h || !a) return null;
  const { name, state } = e.status.type;
  const status = STATUS_VI[name] ?? (state === "in" ? e.status.displayClock || "Đang đá" : state === "post" ? "Hết giờ" : "");
  const team = (t: typeof h): MatchTeam => ({
    name: t.team.shortDisplayName || t.team.displayName,
    logo: t.team.logo,
    score: t.score ?? "",
  });
  return { id: e.id, league, kickoff: e.date, state, status, home: team(h), away: team(a) };
}

async function fetchDay(code: string, league: string, ymd: string): Promise<Match[]> {
  const res = await fetch(`${BASE}/${code}/scoreboard?dates=${ymd}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { events?: EspnEvent[] };
  return (json.events ?? []).map((e) => toMatch(e, league)).filter((m): m is Match => m !== null);
}

// Trận trong 3 ngày (hôm qua · hôm nay · ngày mai giờ VN). ESPN chia ngày theo giờ Mỹ nên lấy
// rộng hơn 1 ngày mỗi phía rồi lọc lại theo ngày Việt Nam. Giải nào lỗi thì bỏ qua giải đó.
export async function getMatches(only?: readonly string[]): Promise<{ matches: Match[]; today: string }> {
  const leagues = only ? LEAGUES.filter((l) => only.includes(l.code)) : LEAGUES;
  const today = vnDateKey();
  const days = [-2, -1, 0, 1].map((n) => shiftDateKey(today, n).replaceAll("-", ""));
  const keep = new Set([-1, 0, 1].map((n) => shiftDateKey(today, n)));

  const settled = await Promise.allSettled(
    leagues.flatMap((l) => days.map((d) => fetchDay(l.code, l.name, d))),
  );
  const seen = new Set<string>();
  const matches = settled
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((m) => keep.has(vnDateKey(new Date(m.kickoff))) && !seen.has(m.id) && seen.add(m.id))
    .sort((x, y) => Date.parse(x.kickoff) - Date.parse(y.kickoff));
  return { matches, today };
}

// Trang chủ: đang đá → sắp đá (gần nhất trước) → vừa kết thúc (mới nhất trước).
// Chừa tối đa 2 chỗ cho kết quả vừa xong để danh sách không toàn trận chưa đá.
export function pickHighlights(matches: Match[], limit: number): Match[] {
  const live = matches.filter((m) => m.state === "in");
  const upcoming = matches.filter((m) => m.state === "pre");
  const done = matches.filter((m) => m.state === "post").reverse();
  const reserved = Math.min(2, done.length);
  const head = [...live, ...upcoming].slice(0, Math.max(0, limit - reserved));
  return [...head, ...done].slice(0, limit);
}
