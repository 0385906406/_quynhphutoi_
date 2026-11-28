import type { Match } from "@/lib/daily/football";
import { vnDateKey, vnTime, shiftDateKey } from "@/lib/daily/time";

function dayLabel(iso: string, today: string): string {
  const key = vnDateKey(new Date(iso));
  if (key === today) return "Hôm nay";
  if (key === shiftDateKey(today, 1)) return "Ngày mai";
  if (key === shiftDateKey(today, -1)) return "Hôm qua";
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

function Team({ t, winner, showScore }: { t: Match["home"]; winner: boolean; showScore: boolean }) {
  return (
    <div className={`qp-match__team${winner ? " is-winner" : ""}`}>
      {t.logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img className="qp-match__logo" src={t.logo} alt="" width={24} height={24} loading="lazy" />
        : <span className="qp-match__logo" aria-hidden />}
      <span className="qp-match__name">{t.name}</span>
      {showScore && <span className="qp-match__score">{t.score}</span>}
    </div>
  );
}

export function MatchItem({ m, today, showLeague = true }: { m: Match; today: string; showLeague?: boolean }) {
  const started = m.state !== "pre";
  const hs = Number(m.home.score), as = Number(m.away.score);
  const done = m.state === "post";
  return (
    <li className={`qp-match is-${m.state}`}>
      <div className="qp-match__when">
        {m.state === "in" ? (
          <span className="qp-match__live"><span className="qp-match__pulse" aria-hidden />{m.status}</span>
        ) : (
          <>
            <span className="qp-match__time">{done ? m.status : vnTime(m.kickoff)}</span>
            <span className="qp-match__day">{done ? vnTime(m.kickoff) + " · " : ""}{dayLabel(m.kickoff, today)}</span>
          </>
        )}
      </div>
      <div className="qp-match__teams">
        {showLeague && <span className="qp-match__league">{m.league}</span>}
        <Team t={m.home} winner={done && hs > as} showScore={started} />
        <Team t={m.away} winner={done && as > hs} showScore={started} />
      </div>
    </li>
  );
}

export function MatchList({ matches, today, showLeague = true }: { matches: Match[]; today: string; showLeague?: boolean }) {
  return (
    <ul className="qp-matches">
      {matches.map((m) => <MatchItem key={m.id} m={m} today={today} showLeague={showLeague} />)}
    </ul>
  );
}
