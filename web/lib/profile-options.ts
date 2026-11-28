// Hồ sơ cá nhân (tuỳ chọn) — hằng số dùng chung cho form, API, admin và gợi ý tin. Client-safe (không import DB).
// Chủ ý chỉ hỏi NĂM sinh (không hỏi ngày/tháng) và không bắt buộc trường nào — người lớn tuổi, người ngại chia sẻ vẫn dùng bình thường.

export const GENDERS = [
  { value: "nam", label: "Nam" },
  { value: "nu", label: "Nữ" },
  { value: "khac", label: "Khác / không muốn nói" },
] as const;
export type Gender = (typeof GENDERS)[number]["value"];

export const OCCUPATIONS = [
  "Học sinh / sinh viên", "Nông dân", "Công nhân", "Kinh doanh / buôn bán", "Cán bộ / viên chức",
  "Giáo viên", "Y tế", "Lao động tự do", "Nội trợ", "Hưu trí", "Khác",
] as const;
export type Occupation = (typeof OCCUPATIONS)[number];

// Chủ đề quan tâm → ánh xạ sang chuyên mục + từ khoá để gợi ý bài (khớp tên chuyên mục tin tức: Thông báo/Đời sống/Kinh tế/Giáo dục…).
export const INTERESTS: { key: string; label: string; cats: string[]; words: string[] }[] = [
  { key: "thong-bao", label: "Thông báo, chính sách", cats: ["thông báo"], words: ["thông báo", "chính sách", "thủ tục", "hành chính"] },
  { key: "doi-song", label: "Đời sống, xã hội", cats: ["đời sống"], words: ["đời sống", "cộng đồng"] },
  { key: "kinh-te", label: "Kinh tế, nông nghiệp", cats: ["kinh tế"], words: ["nông", "lúa", "giá", "chợ", "thu nhập"] },
  { key: "giao-duc", label: "Giáo dục, học tập", cats: ["giáo dục"], words: ["trường", "học sinh", "thi", "tuyển sinh"] },
  { key: "viec-lam", label: "Việc làm, tuyển dụng", cats: [], words: ["việc làm", "tuyển dụng", "lao động", "lương"] },
  { key: "y-te", label: "Sức khoẻ, y tế", cats: [], words: ["sức khoẻ", "y tế", "bệnh", "tiêm", "khám"] },
  { key: "thoi-tiet", label: "Thời tiết, thiên tai", cats: [], words: ["thời tiết", "rét", "mưa", "bão", "nắng"] },
  { key: "the-thao", label: "Thể thao, giải trí", cats: [], words: ["bóng đá", "thể thao", "giải"] },
  { key: "van-hoa", label: "Văn hoá, lễ hội, di tích", cats: [], words: ["lễ hội", "di tích", "văn hoá", "đình", "chùa"] },
  { key: "giao-thong", label: "Giao thông, đi lại", cats: [], words: ["giao thông", "xe", "đường", "an toàn"] },
];
export const INTEREST_KEYS = INTERESTS.map((i) => i.key);

export type AgeGroup = "Dưới 18" | "18–24" | "25–34" | "35–44" | "45–54" | "55–64" | "65 trở lên";
export const AGE_GROUPS: AgeGroup[] = ["Dưới 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65 trở lên"];

export function ageFromYear(birthYear?: number | null, now = new Date()): number | null {
  if (!birthYear) return null;
  const a = now.getFullYear() - birthYear;
  return a >= 0 && a <= 120 ? a : null;
}
export function ageGroup(birthYear?: number | null, now = new Date()): AgeGroup | null {
  const a = ageFromYear(birthYear, now);
  if (a === null) return null;
  return a < 18 ? "Dưới 18" : a < 25 ? "18–24" : a < 35 ? "25–34" : a < 45 ? "35–44" : a < 55 ? "45–54" : a < 65 ? "55–64" : "65 trở lên";
}

export type UserProfile = {
  gender?: Gender | "";
  birthYear?: number | null;
  wardSlug?: string;          // nơi ở (xã / thị trấn) — khớp WARDS
  occupation?: Occupation | "";
  interests?: string[];       // INTEREST_KEYS
  personalize?: boolean;      // đồng ý dùng thông tin này để gợi ý tin & thống kê tổng hợp (mặc định true)
  updatedAt?: string;
};

export const GENDER_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ", khac: "Khác" };

/** Phần trăm hoàn thiện hồ sơ (4 mục chính + chủ đề). */
export function profileCompletion(p?: UserProfile | null): number {
  if (!p) return 0;
  const done = [!!p.gender, !!p.birthYear, !!p.wardSlug, !!p.occupation, (p.interests?.length ?? 0) > 0].filter(Boolean).length;
  return Math.round((done / 5) * 100);
}
