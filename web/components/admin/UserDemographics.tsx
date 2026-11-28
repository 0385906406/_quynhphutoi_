// Cơ cấu người dùng (tổng hợp, không lộ từng người) — để admin biết đang phục vụ ai và phân phối tin cho đúng đối tượng.
import { BarList } from "@/components/admin/charts/BarList";
import { AGE_GROUPS, GENDER_LABEL, INTERESTS } from "@/lib/profile-options";
import { WARDS } from "@/lib/wards";
import type { userDemographics } from "@/lib/users";

type Demo = Awaited<ReturnType<typeof userDemographics>>;

export function UserDemographics({ d }: { d: Demo }) {
  const pct = d.total ? Math.round((d.filled / d.total) * 100) : 0;
  const card = { cursor: "default" as const, gap: "var(--space-3)" };
  const ageOrder = (a: { label: string }, b: { label: string }) => AGE_GROUPS.indexOf(a.label as never) - AGE_GROUPS.indexOf(b.label as never);
  const gender = d.gender.map((g) => ({ label: GENDER_LABEL[g.label] ?? g.label, value: g.value }));
  const age = [...d.age].sort(ageOrder);
  const ward = d.ward.slice(0, 8).map((w) => ({ label: WARDS.find((x) => x.slug === w.label)?.name ?? w.label, value: w.value }));
  const interests = d.interests.slice(0, 8).map((i) => ({ label: INTERESTS.find((x) => x.key === i.label)?.label ?? i.label, value: i.value }));
  const none = d.filled === 0;

  return (
    <section style={{ marginBottom: "var(--space-6)" }} aria-label="Cơ cấu người dùng">
      <div className="qp-admin-card" style={{ ...card, marginBottom: "var(--space-4)" }}>
        <div className="qp-admin-card__label">Cơ cấu người dùng</div>
        <p className="qp-admin-card__desc">
          <b>{d.filled}</b>/{d.total} tài khoản ({pct}%) đã điền hồ sơ cá nhân{d.optedOut > 0 ? <> · {d.optedOut} người không đồng ý chia sẻ (đã loại khỏi thống kê)</> : null}. Số liệu chỉ để tổng hợp, dùng gợi ý tin đúng đối tượng.
        </p>
      </div>
      {none ? (
        <p className="type-body-small text-muted">Chưa có ai điền hồ sơ. Người dùng điền ở Tài khoản → Cài đặt.</p>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="qp-admin-card" style={card}><div className="qp-admin-card__label">Giới tính</div><BarList items={gender} unit=" người" /></div>
          <div className="qp-admin-card" style={card}><div className="qp-admin-card__label">Nhóm tuổi</div><BarList items={age} unit=" người" /></div>
          <div className="qp-admin-card" style={card}><div className="qp-admin-card__label">Nơi ở (top)</div><BarList items={ward} unit=" người" /></div>
          <div className="qp-admin-card" style={card}><div className="qp-admin-card__label">Nghề nghiệp</div><BarList items={d.occupation.slice(0, 8)} unit=" người" /></div>
          <div className="qp-admin-card" style={card}><div className="qp-admin-card__label">Chủ đề quan tâm</div><BarList items={interests} unit=" người" /></div>
        </div>
      )}
    </section>
  );
}
