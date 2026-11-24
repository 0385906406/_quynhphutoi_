// Chiêm tinh 12 con giáp API - Vietnamese Zodiac

export type ZodiacSign =
  | "ty" | "suu" | "dan" | "mao" | "thin" | "ty_chi"
  | "ngo" | "mui" | "than" | "ga" | "cho" | "heo";

export interface Horoscope {
  sign: ZodiacSign;
  vietnamese: string;
  emoji: string;
  luckyLevel: 1 | 2 | 3 | 4 | 5; // 1-5 stars
  reading: string;
  luckyColor: string;
  luckyNumber: number;
  date: string;
}

// Vietnamese 12 zodiac animals
const ZODIAC_INFO: Record<ZodiacSign, { vietnamese: string; emoji: string; year: number }> = {
  ty: { vietnamese: "Tý", emoji: "🐭", year: 0 },
  suu: { vietnamese: "Sửu", emoji: "🐮", year: 1 },
  dan: { vietnamese: "Dần", emoji: "🐯", year: 2 },
  mao: { vietnamese: "Mão", emoji: "🐰", year: 3 },
  thin: { vietnamese: "Thìn", emoji: "🐉", year: 4 },
  ty_chi: { vietnamese: "Tỵ", emoji: "🐍", year: 5 },
  ngo: { vietnamese: "Ngọ", emoji: "🐴", year: 6 },
  mui: { vietnamese: "Mùi", emoji: "🐑", year: 7 },
  than: { vietnamese: "Thân", emoji: "🐵", year: 8 },
  ga: { vietnamese: "Gà", emoji: "🐓", year: 9 },
  cho: { vietnamese: "Chó", emoji: "🐕", year: 10 },
  heo: { vietnamese: "Heo", emoji: "🐷", year: 11 },
};

// Mock horoscope readings
const MOCK_READINGS: Record<ZodiacSign, string> = {
  ty: "Hôm nay là ngày may mắn cho sự nghiệp. Tránh những quyết định lớn vào buổi tối.",
  suu: "Tình yêu sẽ có những bất ngờ dễ chịu. Hãy chú ý tới sức khỏe.",
  dan: "Ngày tốt cho công việc và tài chính. Có cơ hội thăng tiến.",
  mao: "Mọi việc sẽ diễn ra suôn sẻ. Đừng quên dành thời gian cho gia đình.",
  thin: "Năng lực của bạn được công nhận. May mắn ở phía tây.",
  ty_chi: "Tránh xung đột, hãy kiên nhẫn. Tình yêu cần chú ý.",
  ngo: "Cơ hội tốt sẽ đến gần. Hãy sẵn sàng để nắm bắt.",
  mui: "Ngày hạnh phúc với gia đình. Tài chính ổn định.",
  than: "Năng lượng tích cực xung quanh bạn. Hành động nhanh quyết đoán.",
  ga: "Hãy lắng nghe những lời khuyên khác. Sẽ có lợi ích.",
  cho: "Trung thành của bạn sẽ được đánh giá. Tin tưởng vào trực giác.",
  heo: "Hạnh phúc gia đình là ưu tiên. Hãy quan tâm tới sức khỏe.",
};

export function getZodiacByYear(year: number): ZodiacSign {
  const zodiacSigns: ZodiacSign[] = ["ty", "suu", "dan", "mao", "thin", "ty_chi", "ngo", "mui", "than", "ga", "cho", "heo"];
  const index = (year - 1900) % 12;
  return zodiacSigns[index];
}

export async function getHoroscope(sign: ZodiacSign): Promise<Horoscope> {
  const info = ZODIAC_INFO[sign];
  const luckyLevels: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];
  const luckyColors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"];
  const luckyNumbers = [1, 3, 5, 7, 9];

  const index = info.year;

  return {
    sign,
    vietnamese: info.vietnamese,
    emoji: info.emoji,
    luckyLevel: luckyLevels[index % 5] as 1 | 2 | 3 | 4 | 5,
    reading: MOCK_READINGS[sign],
    luckyColor: luckyColors[index % 5],
    luckyNumber: luckyNumbers[index % 5],
    date: new Date().toISOString().split("T")[0],
  };
}

export async function getAllHoroscopes(): Promise<Horoscope[]> {
  const signs: ZodiacSign[] = ["ty", "suu", "dan", "mao", "thin", "ty_chi", "ngo", "mui", "than", "ga", "cho", "heo"];
  return Promise.all(signs.map((sign) => getHoroscope(sign)));
}

export function getZodiacEmoji(sign: ZodiacSign): string {
  return ZODIAC_INFO[sign]?.emoji || "❓";
}

export function getZodiacVietnamese(sign: ZodiacSign): string {
  return ZODIAC_INFO[sign]?.vietnamese || "?";
}
