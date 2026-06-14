// Dữ liệu tin tức mẫu cho Quỳnh Phụ Tôi (minh hoạ).

export type NewsCategory = "Thông báo" | "Đời sống" | "Kinh tế" | "Giáo dục";

export type Article = {
  id: string;
  slug: string;
  category: NewsCategory;
  title: string;
  excerpt: string;
  image: string;
  date: string;     // dd/mm/yyyy
  readTime: string;
  author: string;
  tags: string[];
};

export const NEWS_TABS = ["Tất cả", "Thông báo", "Đời sống", "Kinh tế", "Giáo dục"] as const;
export type NewsTab = (typeof NEWS_TABS)[number];

// Ảnh thật theo chủ đề (loremflickr trả ảnh Flickr khớp từ khoá; ?lock cố định để ảnh ổn định).
const img = (kw: string, lock: number) => `https://loremflickr.com/800/600/${kw}?lock=${lock}`;

export const NEWS: Article[] = [
  { id: "n1", slug: "lich-tuyen-dung-lao-dong-quy-moi", category: "Thông báo", title: "Huyện Quỳnh Phụ công bố lịch tuyển dụng lao động quý mới", excerpt: "Hơn 1.000 vị trí tại các cụm công nghiệp Quỳnh Côi, An Bài và doanh nghiệp địa phương đang chờ ứng viên.", image: img("recruitment", 401), date: "10/06/2026", readTime: "4 phút đọc", author: "Văn phòng UBND", tags: ["Việc làm", "Tuyển dụng", "CCN"] },
  { id: "n2", slug: "huong-dan-dang-ky-tam-tru-truc-tuyen", category: "Đời sống", title: "Hướng dẫn thủ tục đăng ký tạm trú trực tuyến cho người dân", excerpt: "Các bước đăng ký tạm trú qua Cổng dịch vụ công, giúp người dân tiết kiệm thời gian đi lại.", image: img("office", 402), date: "09/06/2026", readTime: "3 phút đọc", author: "Công an huyện", tags: ["Thủ tục", "Dịch vụ công"] },
  { id: "n3", slug: "gia-lua-rau-mau-cho-dau-moi", category: "Kinh tế", title: "Mùa vụ mới: giá lúa và rau màu tại các chợ đầu mối", excerpt: "Cập nhật giá thu mua lúa, rau màu và nông sản tại chợ Quỳnh Côi, chợ Đọ và An Bài tuần này.", image: img("market", 403), date: "08/06/2026", readTime: "5 phút đọc", author: "Cộng tác viên", tags: ["Nông nghiệp", "Giá cả", "Chợ"] },
  { id: "n4", slug: "lich-kham-suc-khoe-mien-phi", category: "Thông báo", title: "Lịch khám sức khoẻ miễn phí tại trạm y tế các xã", excerpt: "Chương trình khám sàng lọc miễn phí cho người cao tuổi và trẻ em diễn ra trong tháng tới.", image: img("hospital", 404), date: "07/06/2026", readTime: "2 phút đọc", author: "Trung tâm Y tế", tags: ["Y tế", "Sức khoẻ"] },
  { id: "n5", slug: "ke-hoach-tuyen-sinh-lop-10", category: "Giáo dục", title: "Kế hoạch tuyển sinh lớp 10 năm học mới của các trường THPT", excerpt: "Chỉ tiêu, lịch thi và phương thức xét tuyển vào lớp 10 các trường THPT trên địa bàn huyện.", image: img("school", 405), date: "06/06/2026", readTime: "4 phút đọc", author: "Phòng GD&ĐT", tags: ["Tuyển sinh", "THPT"] },
  { id: "n6", slug: "ra-quan-ve-sinh-moi-truong", category: "Đời sống", title: "Ra quân vệ sinh môi trường, chỉnh trang đường làng ngõ xóm", excerpt: "Các xã đồng loạt tổ chức dọn vệ sinh, trồng hoa và chỉnh trang cảnh quan nông thôn mới.", image: img("environment", 406), date: "05/06/2026", readTime: "3 phút đọc", author: "Cộng tác viên", tags: ["Môi trường", "Nông thôn mới"] },
  { id: "n7", slug: "ho-tro-von-vay-san-xuat", category: "Kinh tế", title: "Hỗ trợ vốn vay ưu đãi cho hộ sản xuất, kinh doanh nhỏ", excerpt: "Ngân hàng Chính sách xã hội triển khai gói vay ưu đãi cho hộ gia đình phát triển sản xuất.", image: img("bank", 407), date: "04/06/2026", readTime: "4 phút đọc", author: "NHCSXH huyện", tags: ["Vốn vay", "Sản xuất"] },
  { id: "n8", slug: "lich-cho-phien-thang-nay", category: "Thông báo", title: "Lịch chợ phiên Quỳnh Côi và các xã tháng này", excerpt: "Tổng hợp ngày họp chợ phiên theo lịch âm tại các điểm chợ chính trong huyện.", image: img("market", 408), date: "03/06/2026", readTime: "2 phút đọc", author: "Ban quản lý chợ", tags: ["Chợ phiên", "Mua bán"] },
  { id: "n9", slug: "le-hoi-den-a-sao", category: "Đời sống", title: "Chuẩn bị lễ hội truyền thống đền A Sào", excerpt: "Công tác chuẩn bị cho lễ hội đền A Sào — di tích gắn với Hưng Đạo Đại Vương Trần Quốc Tuấn.", image: img("temple", 409), date: "02/06/2026", readTime: "5 phút đọc", author: "Cộng tác viên", tags: ["Lễ hội", "Di tích", "Văn hoá"] },
  { id: "n10", slug: "mo-hinh-trong-trot-hieu-qua", category: "Kinh tế", title: "Nhân rộng mô hình trồng trọt cho thu nhập cao", excerpt: "Một số mô hình chuyển đổi cây trồng tại Quỳnh Phụ mang lại hiệu quả kinh tế rõ rệt.", image: img("agriculture", 410), date: "01/06/2026", readTime: "4 phút đọc", author: "Hội Nông dân", tags: ["Nông nghiệp", "Mô hình"] },
  { id: "n11", slug: "khai-giang-lop-hoc-nghe", category: "Giáo dục", title: "Khai giảng các lớp đào tạo nghề ngắn hạn cho lao động nông thôn", excerpt: "Lớp may công nghiệp, điện dân dụng và kỹ thuật trồng trọt miễn phí cho lao động địa phương.", image: img("classroom", 411), date: "31/05/2026", readTime: "3 phút đọc", author: "Trung tâm GDNN", tags: ["Đào tạo nghề", "Lao động"] },
  { id: "n12", slug: "thong-bao-lich-cat-dien", category: "Thông báo", title: "Thông báo lịch tạm ngừng cấp điện để bảo dưỡng", excerpt: "Điện lực Quỳnh Phụ thông báo lịch tạm ngừng cấp điện phục vụ bảo dưỡng lưới điện tại một số xã.", image: img("powerline", 412), date: "30/05/2026", readTime: "2 phút đọc", author: "Điện lực Quỳnh Phụ", tags: ["Điện", "Thông báo"] },
];

export function getArticle(slug: string): Article | undefined {
  return NEWS.find((a) => a.slug === slug);
}

// Lượt đọc giả lập (ổn định) để xếp "Đọc nhiều" — minh hoạ.
export function articleViews(a: Article): number {
  const base = a.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return 600 + (base % 90) * 52;
}
export function fmtViews(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k lượt đọc` : `${n} lượt đọc`;
}
// dd/mm/yyyy -> số yyyymmdd để sắp xếp.
export function dateKey(d: string): number {
  const [dd, mm, yy] = d.split("/");
  return Number(`${yy}${mm}${dd}`);
}

export function relatedArticles(slug: string, n = 3): Article[] {
  const cur = getArticle(slug);
  const pool = NEWS.filter((a) => a.slug !== slug);
  const sameCat = pool.filter((a) => cur && a.category === cur.category);
  const rest = pool.filter((a) => !sameCat.includes(a));
  return [...sameCat, ...rest].slice(0, n);
}

// Khối nội dung bài viết (sinh từ dữ liệu — minh hoạ).
export type Block = { type: "p" | "h2" | "quote"; text: string };

export function articleBody(a: Article): Block[] {
  return [
    { type: "p", text: a.excerpt },
    { type: "h2", text: "Nội dung chính" },
    { type: "p", text: `Theo thông tin từ ${a.author}, nội dung "${a.title.toLowerCase()}" được triển khai nhằm phục vụ tốt hơn cho người dân huyện Quỳnh Phụ. Các đơn vị liên quan đã phối hợp để bảo đảm thông tin đến với bà con kịp thời, chính xác.` },
    { type: "p", text: "Người dân có thể theo dõi cập nhật mới nhất trên cổng thông tin cộng đồng, hoặc liên hệ trực tiếp với UBND xã, thị trấn nơi cư trú để được hướng dẫn cụ thể." },
    { type: "quote", text: "Mục tiêu là để mọi người dân Quỳnh Phụ đều dễ dàng tiếp cận thông tin cần thiết, thuận tiện và nhanh chóng." },
    { type: "h2", text: "Người dân cần lưu ý" },
    { type: "p", text: "Thông tin trên trang mang tính tổng hợp, tham khảo. Với các thủ tục hành chính, vui lòng đối chiếu hướng dẫn chính thức của cơ quan chức năng để bảo đảm chính xác." },
  ];
}
