import Link from "next/link";
import { getXsmbDraws, isTodayPending } from "@/lib/daily/lottery";
import { getMatches, pickHighlights } from "@/lib/daily/football";
import { getGoldPrices, getExchangeRates, sortFx } from "@/lib/daily/markets";
import { formatDateKey, vnDateKey } from "@/lib/daily/time";
import type { WeatherData } from "@/lib/weather";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import type { HomeBlocksConfig } from "@/lib/home-blocks";
import { DailyCard, DailyUnavailable } from "./DailyCard";
import { DailyTabs } from "./DailyTabs";
import { XsmbBoard } from "./XsmbBoard";
import { MatchList } from "./MatchList";
import { GoldTable, FxTable } from "./MarketTables";

const HOME_GOLD = ["SJC", "N24K", "24K"];
const HOME_FX = 5;

const value = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);

// Khối "Thông tin hôm nay" trang chủ. Mỗi nguồn lỗi độc lập — 1 nguồn hỏng chỉ khối đó báo lỗi.
export async function DailyHub({ weather, cfg }: { weather: WeatherData | null; cfg: HomeBlocksConfig }) {
  if (!cfg.daily || !(cfg.gold || cfg.fx || cfg.lottery || cfg.football)) return null;
  // Chỉ tải nguồn của thẻ đang bật.
  const [lotteryR, footballR, goldR, fxR] = await Promise.allSettled([
    cfg.lottery ? getXsmbDraws(1) : Promise.reject(),
    cfg.football ? getMatches(cfg.leagues) : Promise.reject(),
    cfg.gold ? getGoldPrices() : Promise.reject(),
    cfg.fx ? getExchangeRates() : Promise.reject(),
  ]);
  const draw = value(lotteryR)?.[0];
  const football = value(footballR);
  const gold = value(goldR);
  const fx = value(fxR);
  const today = vnDateKey();

  const lottery = (
    <DailyCard
      icon="ticket"
      title="Xổ số miền Bắc"
      meta={draw ? `Kỳ quay ${formatDateKey(draw.date)}` : undefined}
      href="/xo-so"
      linkLabel="Xem lô tô & các kỳ trước"
    >
      {draw ? (
        <>
          {isTodayPending(draw) && <p className="qp-daily-note">Kết quả hôm nay đang được cập nhật.</p>}
          <XsmbBoard draw={draw} />
        </>
      ) : <DailyUnavailable what="kết quả xổ số" />}
    </DailyCard>
  );

  const highlights = football ? pickHighlights(football.matches, cfg.matches) : [];
  const liveCount = football?.matches.filter((m) => m.state === "in").length ?? 0;
  const soccer = (
    <DailyCard
      icon="ball"
      title="Bóng đá"
      meta={liveCount ? `${liveCount} trận đang diễn ra` : "Lịch thi đấu & kết quả"}
      href="/bong-da"
      linkLabel="Xem tất cả trận"
    >
      {!football ? <DailyUnavailable what="lịch thi đấu" />
        : highlights.length ? <MatchList matches={highlights} today={football.today} />
        : <p className="qp-daily-empty">Không có trận đấu ở các giải lớn trong hôm nay và ngày mai.</p>}
    </DailyCard>
  );

  const goldRows = gold ? HOME_GOLD.map((c) => gold.rows.find((r) => r.code === c)).filter((r) => r !== undefined) : [];
  const goldCard = (
    <DailyCard icon="coin" title="Giá vàng" meta={gold?.updatedAt ? `PNJ · cập nhật ${gold.updatedAt}` : undefined} href="/gia-vang">
      {goldRows.length ? (
        <>
          <GoldTable rows={goldRows} />
          <p className="qp-daily-unit">Giá cho 1 lượng (10 chỉ)</p>
        </>
      ) : <DailyUnavailable what="giá vàng" />}
    </DailyCard>
  );

  const fxCard = (
    <DailyCard icon="exchange" title="Tỷ giá ngoại tệ" meta={fx?.updatedAt ? `Vietcombank · ${fx.updatedAt}` : undefined} href="/gia-vang#ty-gia">
      {fx?.rows.length ? (
        <>
          <FxTable rows={sortFx(fx.rows).slice(0, HOME_FX)} />
          <p className="qp-daily-unit">Giá đổi 1 đơn vị ngoại tệ</p>
        </>
      ) : <DailyUnavailable what="tỷ giá" />}
    </DailyCard>
  );

  return (
    <section className="section qp-daily" aria-labelledby="daily-title">
      <div className="container-wide">
        <header className="qp-daily__head">
          <div className="qp-sechead__titles">
            <span className="type-tag qp-sechead__eyebrow">{formatDateKey(today)}</span>
            <h2 id="daily-title" className="type-h2">Thông tin hôm nay</h2>
          </div>
          {cfg.weather && weather && (
            <Link className="qp-daily__weather" href="/thoi-tiet">
              <span className="qp-daily__weather-icon"><WeatherIcon icon={weather.current.icon} size={30} /></span>
              <span className="qp-daily__weather-temp">{weather.current.temp}°C</span>
              <span className="qp-daily__weather-text">
                <b>{weather.current.label}</b>
                <span>{weather.locationName}</span>
              </span>
            </Link>
          )}
        </header>

        <DailyTabs
          mobileOnly
          label="Thông tin hôm nay"
          gridClassName="qp-daily__grid"
          panels={[
            { id: "vang", label: "Giá vàng", className: "qp-daily__gold", node: goldCard },
            { id: "ty-gia", label: "Tỷ giá", className: "qp-daily__fx", node: fxCard },
            { id: "xo-so", label: "Xổ số", className: "qp-daily__lottery", node: lottery },
            { id: "bong-da", label: "Bóng đá", className: "qp-daily__soccer", node: soccer },
          ].filter((p) => ({ vang: cfg.gold, "ty-gia": cfg.fx, "xo-so": cfg.lottery, "bong-da": cfg.football } as Record<string, boolean>)[p.id])}
        />
      </div>
    </section>
  );
}
