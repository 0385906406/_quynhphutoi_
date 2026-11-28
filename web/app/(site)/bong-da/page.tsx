import { pageMetadata } from "@/lib/page-seo";
import { getHomeBlocks } from "@/lib/home-blocks";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb } from "@/lib/seo";
import { getMatches, LEAGUES, type Match } from "@/lib/daily/football";
import { vnDateKey, shiftDateKey, formatDateKey } from "@/lib/daily/time";
import { MatchList } from "@/components/daily/MatchList";
import { DailyTabs, type DailyPanel } from "@/components/daily/DailyTabs";
import { DailyPageHero, DailyError } from "@/components/daily/DailyPageHero";

export async function generateMetadata() {
  return pageMetadata({
    key: "/bong-da", path: "/bong-da",
    title: "Lịch thi đấu & kết quả bóng đá hôm nay",
    description: "Lịch thi đấu, tỷ số trực tiếp và kết quả bóng đá hôm qua, hôm nay, ngày mai: Ngoại hạng Anh, La Liga, Serie A, Bundesliga, Ligue 1, Cúp C1, Cúp C2, AFC Champions League. Giờ Việt Nam.",
  });
}

export const dynamic = "force-dynamic";

function DayPanel({ matches, today }: { matches: Match[]; today: string }) {
  if (!matches.length) return <p className="qp-daily-empty">Không có trận đấu ở các giải đang theo dõi.</p>;
  const groups = LEAGUES.map((l) => ({ name: l.name, list: matches.filter((m) => m.league === l.name) })).filter((g) => g.list.length);
  return (
    <div className="qp-league-groups">
      {groups.map((g) => (
        <section className="qp-daily-card" key={g.name} aria-label={g.name}>
          <h3 className="qp-daily-card__title">{g.name} <span className="qp-daily-card__meta">· {g.list.length} trận</span></h3>
          <MatchList matches={g.list} today={today} showLeague={false} />
        </section>
      ))}
    </div>
  );
}

export default async function BongDaPage() {
  const data = await getMatches((await getHomeBlocks()).leagues).catch(() => null);
  const today = data?.today ?? vnDateKey();
  const byDay = (offset: number) => {
    const key = shiftDateKey(today, offset);
    return (data?.matches ?? []).filter((m) => vnDateKey(new Date(m.kickoff)) === key);
  };
  const days: [number, string][] = [[0, "Hôm nay"], [1, "Ngày mai"], [-1, "Hôm qua"]];
  const panels: DailyPanel[] = days.map(([offset, label]) => {
    const list = byDay(offset);
    return {
      id: `d${offset + 1}`,
      label: `${label} (${list.length})`,
      node: (
        <>
          <p className="qp-daily-card__meta qp-league-groups__date">{formatDateKey(shiftDateKey(today, offset))}</p>
          <DayPanel matches={list} today={today} />
        </>
      ),
    };
  });

  return (
    <>
      <JsonLd data={[jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Bóng đá", path: "/bong-da" }])]} />
      <DailyPageHero
        id="bd-title"
        crumb="Bóng đá"
        eyebrow="Hôm nay · Thể thao"
        title="Lịch thi đấu & kết quả bóng đá"
        lead="Tỷ số trực tiếp, lịch đấu và kết quả các giải lớn — giờ thi đấu đã quy đổi sang giờ Việt Nam."
      />
      <section className="section">
        <div className="container-wide">
          {!data ? <DailyError what="lịch thi đấu" /> : <DailyTabs label="Chọn ngày" panels={panels} />}
          <p className="qp-daily-source">Dữ liệu từ ESPN, cập nhật mỗi 2 phút.</p>
        </div>
      </section>
    </>
  );
}
