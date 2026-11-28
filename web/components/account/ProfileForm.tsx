"use client";

// Form thông tin tài khoản: ảnh đại diện + tên hiển thị + hồ sơ cá nhân TUỲ CHỌN (giới tính, năm sinh, nơi ở, nghề, chủ đề quan tâm).
// Hồ sơ giúp gợi ý tin phù hợp và giúp ban quản trị hiểu người đọc (chỉ thống kê tổng hợp). Email chỉ đọc.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CharCount } from "@/components/common/CharCount";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useAdaptiveCaptcha } from "@/components/common/useAdaptiveCaptcha";
import { useToast } from "@/components/common/Toast";
import { GENDERS, INTERESTS, OCCUPATIONS, profileCompletion, type UserProfile } from "@/lib/profile-options";
import { WARDS } from "@/lib/wards";

const YEARS = (() => { const y = new Date().getFullYear(); return Array.from({ length: 106 }, (_, i) => y - 5 - i); })();

type Draft = Required<Pick<UserProfile, "gender" | "wardSlug" | "occupation">> & { birthYear: number | null; interests: string[]; personalize: boolean };
const toDraft = (p: UserProfile): Draft => ({
  gender: p.gender ?? "", birthYear: p.birthYear ?? null, wardSlug: p.wardSlug ?? "", occupation: p.occupation ?? "",
  interests: p.interests ?? [], personalize: p.personalize !== false,
});

export function ProfileForm({ initialName, email, initialAvatar = "", initialProfile = {} }: { initialName: string; email: string; initialAvatar?: string; initialProfile?: UserProfile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [p, setP] = useState<Draft>(() => toDraft(initialProfile));
  const [busy, setBusy] = useState(false);
  const cap = useAdaptiveCaptcha();
  const base = useMemo(() => JSON.stringify(toDraft(initialProfile)), [initialProfile]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setP((c) => ({ ...c, [k]: v }));
  const toggleInterest = (k: string) => set("interests", p.interests.includes(k) ? p.interests.filter((x) => x !== k) : [...p.interests, k]);
  const pct = profileCompletion(p);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, profile: p, recaptchaToken: cap.token() }),
      });
      const data = await res.json().catch(() => ({}));
      cap.reset();
      if (cap.challenged(res, data)) { toast.error("Vui lòng xác nhận reCAPTCHA rồi gửi lại."); return; }
      if (!res.ok) { toast.error(data.error || "Có lỗi xảy ra."); return; }
      toast.success("Đã lưu thông tin.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const changed =
    (name.trim() !== initialName.trim() && name.trim().length >= 2) ||
    avatar !== initialAvatar ||
    JSON.stringify(p) !== base;

  return (
    <form className="qp-acc-form" onSubmit={submit}>
      <div className="qp-form-group">
        <label className="qp-label">Ảnh đại diện</label>
        <ImageUploader value={avatar ? [avatar] : []} onChange={(a) => setAvatar(a[0] ?? "")} max={1} />
        <span className="qp-acc-form__hint">Ảnh vuông đẹp nhất. Để trống = dùng chữ cái đầu của tên.</span>
      </div>
      <div className="qp-form-group">
        <label className="qp-label" htmlFor="acc-name">Tên hiển thị <span className="req">*</span><CharCount value={name} max={60} /></label>
        <input id="acc-name" className="qp-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="Họ và tên của bạn" />
      </div>
      <div className="qp-form-group">
        <label className="qp-label" htmlFor="acc-email">Email</label>
        <input id="acc-email" className="qp-input" value={email} disabled readOnly />
        <span className="qp-acc-form__hint">Email dùng để đăng nhập, không thể thay đổi.</span>
      </div>

      <fieldset className="qp-acc-about">
        <legend>Về bạn <span>(không bắt buộc)</span></legend>
        <p className="qp-acc-form__hint" style={{ marginTop: 0 }}>Chia sẻ để chúng tôi gợi ý tin tức, việc làm phù hợp với bạn. Bạn có thể bỏ trống bất kỳ mục nào.</p>
        <div className="qp-acc-meter" role="img" aria-label={`Hồ sơ hoàn thiện ${pct}%`}>
          <span style={{ width: `${pct}%` }} /><b>{pct}%</b>
        </div>

        <div className="qp-form-group">
          <span className="qp-label" id="lbl-gender">Giới tính</span>
          <div className="qp-acc-chips" role="radiogroup" aria-labelledby="lbl-gender">
            {GENDERS.map((g) => (
              <label key={g.value} className={`qp-acc-chip${p.gender === g.value ? " is-on" : ""}`}>
                <input type="radio" name="gender" checked={p.gender === g.value} onChange={() => set("gender", g.value)} />
                {g.label}
              </label>
            ))}
            {p.gender && <button type="button" className="qp-acc-clear" onClick={() => set("gender", "")}>Bỏ chọn</button>}
          </div>
        </div>

        <div className="qp-acc-row2">
          <div className="qp-form-group">
            <label className="qp-label" htmlFor="acc-year">Năm sinh</label>
            <select id="acc-year" className="qp-input" value={p.birthYear ?? ""} onChange={(e) => set("birthYear", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Chọn năm sinh —</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="qp-form-group">
            <label className="qp-label" htmlFor="acc-ward">Nơi ở</label>
            <select id="acc-ward" className="qp-input" value={p.wardSlug} onChange={(e) => set("wardSlug", e.target.value)}>
              <option value="">— Chọn xã / thị trấn —</option>
              {WARDS.map((w) => <option key={w.slug} value={w.slug}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="qp-form-group">
          <label className="qp-label" htmlFor="acc-job">Nghề nghiệp</label>
          <select id="acc-job" className="qp-input" value={p.occupation} onChange={(e) => set("occupation", e.target.value as Draft["occupation"])}>
            <option value="">— Chọn nghề nghiệp —</option>
            {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="qp-form-group">
          <span className="qp-label" id="lbl-int">Bạn quan tâm đến <span className="qp-acc-form__hint" style={{ display: "inline" }}>(chọn nhiều)</span></span>
          <div className="qp-acc-chips" role="group" aria-labelledby="lbl-int">
            {INTERESTS.map((i) => (
              <label key={i.key} className={`qp-acc-chip${p.interests.includes(i.key) ? " is-on" : ""}`}>
                <input type="checkbox" checked={p.interests.includes(i.key)} onChange={() => toggleInterest(i.key)} />
                {i.label}
              </label>
            ))}
          </div>
        </div>

        <label className="qp-acc-consent">
          <input type="checkbox" checked={p.personalize} onChange={(e) => set("personalize", e.target.checked)} />
          <span>Cho phép dùng thông tin này để gợi ý tin phù hợp và thống kê <b>tổng hợp</b> (không công khai cá nhân bạn).</span>
        </label>
      </fieldset>

      {cap.slot}
      <button type="submit" className="qp-btn-primary" disabled={busy || !changed}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button>
    </form>
  );
}
