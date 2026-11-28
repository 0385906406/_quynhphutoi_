import { pageMetadata } from "@/lib/page-seo";
import { JsonLd } from "@/components/common/JsonLd";
import { jsonLdBreadcrumb } from "@/lib/seo";
import { getXsmbDraws, isTodayPending } from "@/lib/daily/lottery";
import { formatDateKey } from "@/lib/daily/time";
import { XsmbBoard, LotoTable } from "@/components/daily/XsmbBoard";
import { DailyPageHero, DailyError } from "@/components/daily/DailyPageHero";

export async function generateMetadata() {
  return pageMetadata({
    key: "/xo-so", path: "/xo-so",
    title: "Kết quả xổ số miền Bắc hôm nay (XSMB)",
    description: "Kết quả xổ số miền Bắc (XSMB) mới nhất: giải đặc biệt, giải nhất đến giải bảy, bảng lô tô theo đầu số và kết quả 7 kỳ gần nhất.",
  });
}

export const dynamic = "force-dynamic";

const HISTORY = 7;

export default async function XoSoPage() {
  const draws = await getXsmbDraws(HISTORY).catch(() => null);
  const [latest, ...older] = draws ?? [];

  return (
    <>
      <JsonLd data={[jsonLdBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Xổ số miền Bắc", path: "/xo-so" }])]} />
      <DailyPageHero
        id="xs-title"
        crumb="Xổ số miền Bắc"
        eyebrow="Hôm nay · Xổ số"
        title="Kết quả xổ số miền Bắc"
        lead="Quay thưởng lúc 18:15 hằng ngày. Kết quả mới nhất, bảng lô tô và các kỳ gần đây."
      />

      <section className="section">
        <div className="container-wide">
          {!latest ? <DailyError what="kết quả xổ số" /> : (
            <>
              {isTodayPending(latest) && (
                <div className="qp-alert is-info" role="status">
                  <div className="qp-alert__body"><strong>Kết quả hôm nay đang được cập nhật.</strong> Dưới đây là kỳ gần nhất.</div>
                </div>
              )}
              <div className="qp-xsmb-layout">
                <div className="qp-daily-card">
                  <h2 className="qp-daily-card__title qp-xsmb-layout__title">XSMB {formatDateKey(latest.date)}</h2>
                  <XsmbBoard draw={latest} />
                </div>
                <div className="qp-daily-card">
                  <h2 className="qp-daily-card__title qp-xsmb-layout__title">Lô tô {formatDateKey(latest.date, false)}</h2>
                  <LotoTable draw={latest} />
                </div>
              </div>

              {older.length > 0 && (
                <div className="qp-xsmb-history">
                  <h2 className="type-h3">Các kỳ trước</h2>
                  {older.map((d) => (
                    <details className="qp-xsmb-history__item" key={d.date}>
                      <summary>
                        <span>XSMB {formatDateKey(d.date)}</span>
                        <span className="qp-xsmb-history__special">ĐB <b>{d.special}</b></span>
                      </summary>
                      <XsmbBoard draw={d} />
                    </details>
                  ))}
                </div>
              )}

              <p className="qp-daily-source">
                Dữ liệu tổng hợp từ bộ dữ liệu mở về kết quả XSMB, chỉ mang tính tham khảo. Vui lòng đối chiếu
                với kết quả chính thức của công ty xổ số kiến thiết trước khi lĩnh thưởng.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
