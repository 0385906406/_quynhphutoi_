import { pageMetadata } from "@/lib/page-seo";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb } from "@/lib/seo";
import { getGoldPrices, getExchangeRates, sortFx } from "@/lib/daily/markets";
import { GoldTable, FxTable } from "@/components/daily/MarketTables";
import { DailyPageHero, DailyError } from "@/components/daily/DailyPageHero";

export async function generateMetadata() {
  return pageMetadata({
    key: "/gia-vang", path: "/gia-vang",
    title: "Giá vàng & tỷ giá ngoại tệ hôm nay",
    description: "Giá vàng miếng SJC, nhẫn trơn 999.9, vàng nữ trang mới nhất và tỷ giá USD, EUR, Yên Nhật, Won Hàn Quốc, Nhân dân tệ tại Vietcombank hôm nay.",
  });
}

export const dynamic = "force-dynamic";

export default async function GiaVangPage() {
  const [gold, fx] = await Promise.all([
    getGoldPrices().catch(() => null),
    getExchangeRates().catch(() => null),
  ]);

  return (
    <>
      <JsonLd data={[jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Giá vàng & tỷ giá", path: "/gia-vang" }])]} />
      <DailyPageHero
        id="gv-title"
        crumb="Giá vàng & tỷ giá"
        eyebrow="Hôm nay · Thị trường"
        title="Giá vàng & tỷ giá hôm nay"
        lead="Giá vàng niêm yết tại PNJ (gồm vàng miếng SJC) và tỷ giá ngoại tệ của Vietcombank."
      />
      <section className="section">
        <div className="container-wide qp-market-layout">
          <div className="qp-daily-card">
            <h2 className="qp-daily-card__title">Giá vàng</h2>
            {gold?.rows.length ? (
              <>
                <p className="qp-daily-card__meta">Cập nhật {gold.updatedAt} · Giá cho 1 lượng (10 chỉ)</p>
                <GoldTable rows={gold.rows} />
              </>
            ) : <DailyError what="giá vàng" />}
          </div>
          <div className="qp-daily-card" id="ty-gia">
            <h2 className="qp-daily-card__title">Tỷ giá ngoại tệ</h2>
            {fx?.rows.length ? (
              <>
                <p className="qp-daily-card__meta">Vietcombank · {fx.updatedAt} · Giá đổi 1 đơn vị ngoại tệ</p>
                <FxTable rows={sortFx(fx.rows)} showTransfer />
              </>
            ) : <DailyError what="tỷ giá" />}
          </div>
        </div>
        <div className="container-wide">
          <p className="qp-daily-source">Giá chỉ mang tính tham khảo và có thể thay đổi trong ngày; giá giao dịch thực tế theo từng cửa hàng, ngân hàng.</p>
        </div>
      </section>
    </>
  );
}
