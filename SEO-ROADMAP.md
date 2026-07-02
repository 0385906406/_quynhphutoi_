# SEO Roadmap — Cổng thông tin Quỳnh Phụ
> Mục tiêu: Tăng Authority Score từ 2 → 20+ và traffic từ organic search trong 6 tháng.
> Cập nhật lần cuối: 2026-06-22

---

## Tình trạng ban đầu

| Chỉ số | Hiện tại | Mục tiêu 3 tháng | Mục tiêu 6 tháng |
|---|---|---|---|
| Authority Score (Semrush) | 2 | 8–12 | 18–25 |
| Referring Domains | ~2 | 20+ | 50+ |
| Organic Keywords | Chưa rõ | 50+ | 200+ |
| Organic Traffic/tháng | Thấp | 500+ | 2.000+ |

**Nền kỹ thuật hiện tại: TỐT** — Sitemap, robots.txt, JSON-LD, OpenGraph, RSS Feed, Canonical đã đầy đủ. Vấn đề nằm ở off-page SEO (backlink) và khối lượng nội dung.

---

## GIAI ĐOẠN 1 — Nền tảng (Tuần 1–2)

### 1.1 Google Search Console
- [ ] Đăng nhập [Google Search Console](https://search.google.com/search-console)
- [ ] Thêm property: `https://www.quynhphutoi.io.vn`
- [ ] Xác minh bằng HTML tag: Admin → Cài đặt → SEO → dán vào ô "Google Verification Code"
- [ ] Submit sitemap: `https://www.quynhphutoi.io.vn/sitemap.xml`
- [ ] Kiểm tra mục "Coverage" — xem trang nào bị lỗi index
- [ ] Kiểm tra mục "Core Web Vitals" — xem tốc độ trang


























































### 1.2 Google Analytics 4
- [ ] Tạo property GA4 tại [analytics.google.com](https://analytics.google.com)
- [ ] Lấy Measurement ID (dạng `G-XXXXXXXXXX`)
- [ ] Điền vào biến môi trường `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] Xác nhận data đang được nhận trong GA4 → Realtime

### 1.3 Google Business Profile
- [ ] Truy cập [google.com/business](https://business.google.com)
- [ ] Tạo profile: Tên = "Cổng thông tin Quỳnh Phụ", Loại = "Tổ chức truyền thông/Cổng thông tin"
- [ ] Điền website: `https://www.quynhphutoi.io.vn`
- [ ] Xác minh qua bưu điện hoặc điện thoại
- **Tác động:** Backlink từ google.com — 1 trong những backlink có authority cao nhất có thể nhận miễn phí

### 1.4 Bing Webmaster Tools
- [ ] Đăng ký tại [bing.com/webmasters](https://www.bing.com/webmasters)
- [ ] Xác minh và submit sitemap
- [ ] Lấy verification meta tag → Admin → Cài đặt → SEO → ô "Bing Verification"

---

## GIAI ĐOẠN 2 — Backlink chất lượng cao (Tháng 1–2)

### 2.1 Wikipedia (Ưu tiên cao nhất)

Wikipedia có Domain Authority ~93/100 — 1 backlink từ đây tương đương hàng chục backlink thông thường.

- [ ] Tìm bài viết "Quỳnh Phụ" trên Wikipedia tiếng Việt
- [ ] Nếu chưa có bài về xã Quỳnh Phụ → tạo bài mới
- [ ] Nếu đã có bài về huyện Quỳnh Phụ → thêm mục "Xem thêm" hoặc "Liên kết ngoài"
- [ ] Nội dung link: `[Cổng thông tin xã Quỳnh Phụ](https://www.quynhphutoi.io.vn) — Tin tức, dịch vụ và thông tin cộng đồng`
- **Lưu ý:** Phải có nội dung thực sự hữu ích trên site thì Wikipedia mới giữ link

### 2.2 Trang chính quyền địa phương

- [ ] Liên hệ UBND xã Quỳnh Phụ → đề nghị đặt link trong trang "Tin tức địa phương" hoặc "Liên kết hữu ích"
- [ ] Liên hệ UBND huyện Quỳnh Phụ → tương tự
- [ ] Liên hệ Cổng thông tin điện tử tỉnh Thái Bình (thaibinh.gov.vn) → đề nghị giới thiệu
- **Cách tiếp cận:** Gửi công văn/email giới thiệu site là kênh thông tin phi lợi nhuận phục vụ cộng đồng

### 2.3 Báo địa phương

- [ ] **Báo Thái Bình** (baothaibinh.com.vn) — DA ~40
  - Gửi thông cáo báo chí khi có sự kiện địa phương đáng đưa tin
  - Đề nghị hợp tác: họ đưa tin → bạn dẫn nguồn → họ link ngược lại
- [ ] **Cổng TTĐT huyện Quỳnh Phụ** — nếu có
- [ ] **VnExpress/Tuổi Trẻ địa phương** — khi có tin viral từ Quỳnh Phụ

### 2.4 Backlink từ nội dung trong DB của chính site

Các tổ chức đã có trang trên site → đề nghị họ link ngược lại:

- [ ] Gửi email/gọi cho từng **trường học** trong module `/truong-hoc` → "Trường đã có trang giới thiệu tại [link] — nhà trường có thể đặt link này trên website của trường không?"
- [ ] Tương tự với **cơ sở y tế** trong `/y-te`
- [ ] Tương tự với **doanh nghiệp** đang đăng tuyển dụng trong `/viec-lam`
- **Tác động:** Mỗi trường/cơ sở y tế thường có DA 20–40, đây là nguồn backlink địa phương rất tốt

### 2.5 Directory và listing site

- [ ] **Dmoz.vn** hoặc các directory Việt Nam
- [ ] **Foursquare / Yelp** — tạo listing địa điểm
- [ ] **Hotline.vn** — đăng ký tổ chức
- [ ] **Vietnam Business Directory** — nếu có danh mục phi lợi nhuận/truyền thông

---

## GIAI ĐOẠN 3 — Nội dung "link magnet" (Tháng 2–4)

Nội dung link magnet = nội dung mà người khác tự nhiên muốn dẫn nguồn về.

### 3.1 Nội dung tra cứu thường xuyên (Evergreen)

| Loại nội dung | Từ khóa mục tiêu | Cập nhật |
|---|---|---|
| Lịch phiên chợ chi tiết từng chợ | "lịch chợ Quỳnh Phụ" | Mỗi năm |
| Danh sách số điện thoại cơ sở y tế | "phòng khám Quỳnh Phụ" | Hàng quý |
| Bản đồ di tích lịch sử | "di tích Quỳnh Phụ" | Mỗi năm |
| Giá đất/thuê mặt bằng | "giá đất Quỳnh Phụ" | Hàng quý |
| Lịch xe buýt tuyến Quỳnh Phụ | "xe buýt Quỳnh Phụ" | Khi thay đổi |

### 3.2 Thống kê định kỳ (Báo chí hay trích dẫn)

Tạo **báo cáo hàng tháng** dạng bài viết:
- "Thị trường lao động Quỳnh Phụ tháng X/202X: X tin tuyển dụng, ngành Y hot nhất"
- "Hoạt động mua bán tháng X: X tin đăng, mặt hàng phổ biến nhất"
- Đăng lên site → chia sẻ lên báo địa phương → họ trích dẫn số liệu → backlink tự nhiên

### 3.3 Từ khóa long-tail địa phương (Ưu tiên trong nội dung)

Đây là những từ khóa có ít cạnh tranh nhất, dễ lên top nhất:

```
"trường tiểu học [tên xã] Quỳnh Phụ"
"phòng khám nha khoa Quỳnh Phụ Thái Bình"
"việc làm gần Quỳnh Phụ không cần bằng cấp"
"mua đất thổ cư xã [tên] Quỳnh Phụ"
"di tích lịch sử cấp quốc gia Quỳnh Phụ"
"xe buýt từ Quỳnh Phụ đi Thái Bình"
```

---

## GIAI ĐOẠN 4 — Tăng traffic xã hội (Tháng 1–6, song song)

Traffic từ mạng xã hội không tăng Authority Score trực tiếp nhưng tăng **brand awareness** và **indirect backlink**.

### 4.1 Facebook
- [ ] Tạo Fanpage "Cổng thông tin Quỳnh Phụ"
- [ ] Đăng đều 1–2 bài/ngày từ nội dung trên site (auto-post bằng RSS → Facebook)
- [ ] Tham gia và đăng nội dung trong các group: "Người Quỳnh Phụ", "Huyện Quỳnh Phụ - Thái Bình"
- [ ] Đặt link website trong phần Giới thiệu Fanpage

### 4.2 Zalo
- [ ] Tạo Zalo Official Account
- [ ] Điền link website trong profile
- [ ] Đăng bài đều đặn, link về bài chi tiết trên site

### 4.3 YouTube (Dài hạn)
- [ ] Tạo kênh YouTube "Quỳnh Phụ Tôi"
- [ ] Upload video ngắn về di tích, sự kiện địa phương
- [ ] Đặt link website trong description mỗi video
- **Tác động:** YouTube có DA 100 — backlink rất có giá trị

---

## GIAI ĐOẠN 5 — Tối ưu On-page liên tục (Mỗi tuần)

### 5.1 Checklist khi đăng bài mới
- [ ] Title có từ khóa chính (50–60 ký tự)
- [ ] Meta description hấp dẫn (150–160 ký tự), có từ khóa
- [ ] URL slug ngắn gọn, có từ khóa
- [ ] Ảnh bìa có alt text mô tả
- [ ] Bài dài ít nhất 400–600 từ
- [ ] Có internal link đến ít nhất 2–3 bài/trang khác trên site
- [ ] Có external link đến 1 nguồn uy tín (báo lớn, tài liệu chính phủ)

### 5.2 Internal linking strategy
Mỗi bài viết tin tức nên link đến:
- Module liên quan (bài về trường → trang `/truong-hoc`)
- Bài viết cùng chủ đề đã có
- Trang danh sách category

### 5.3 Từ khóa nên tránh
Không cố tối ưu các từ khóa tổng quát quá rộng ngay từ đầu:
- ❌ "Thái Bình" (cạnh tranh cao)
- ❌ "tin tức Thái Bình" (báo lớn chiếm hết top)
- ✅ "tin tức xã Quỳnh Phụ" (ít cạnh tranh, đúng đối tượng)
- ✅ "việc làm Quỳnh Phụ 2026" (long-tail, dễ rank)

---

## Công cụ theo dõi (Miễn phí)

| Công cụ | Mục đích | Link |
|---|---|---|
| Google Search Console | Theo dõi keyword, crawl error | search.google.com/search-console |
| Google Analytics 4 | Theo dõi traffic, hành vi | analytics.google.com |
| Semrush (free) | Kiểm tra Authority Score, backlink | semrush.com |
| Ahrefs Webmaster Tools | Backlink audit miễn phí | ahrefs.com/webmaster-tools |
| PageSpeed Insights | Kiểm tra Core Web Vitals | pagespeed.web.dev |
| Google Rich Results Test | Kiểm tra JSON-LD structured data | search.google.com/test/rich-results |

---

## Timeline tổng hợp

```
Tuần 1–2:   GSC + GA4 + Google Business Profile + Bing Webmaster
Tháng 1:    Wikipedia link + Fanpage Facebook + Zalo OA
Tháng 2:    Email trường học/y tế + Báo địa phương lần 1
Tháng 3:    Báo cáo thống kê lần 1 + Directory listing
Tháng 4:    Email follow-up + Nội dung evergreen tra cứu
Tháng 5–6:  Duy trì đăng bài đều đặn + Theo dõi GSC optimize
```

---

## Dấu hiệu đang đi đúng hướng

- GSC hiển thị số impression/click tăng dần mỗi tháng
- Referring domains tăng từ 2 → 10+ sau 2 tháng
- Xuất hiện kết quả Rich Snippet (sao đánh giá, breadcrumb) trên Google
- Một số từ khóa long-tail lọt vào top 20 sau 2–3 tháng

---

## Những gì KHÔNG nên làm

- ❌ Mua backlink từ dịch vụ SEO rẻ tiền — Google phạt và giảm ranking
- ❌ Nhồi nhét từ khóa vào bài viết — penalty về chất lượng nội dung
- ❌ Tạo nhiều trang nội dung mỏng chỉ để có URL — Google Panda penalty
- ❌ Copy nội dung từ báo khác không xin phép — duplicate content penalty
- ❌ Link exchange ồ ạt với site không liên quan — mất tự nhiên, bị đánh giá thấp
