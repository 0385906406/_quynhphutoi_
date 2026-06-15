# Tasks: Home Sections Config (Admin cấu hình khối trang chủ)

> Mode: scoped. Không có ba-specs — "spec" = mô tả user + pattern repo `web/`.
> Feature: Admin cấu hình 4 khối trang chủ (Tin tức/Việc làm/Tìm đồ rơi/Mua bán).
> Mỗi khối chọn chế độ: latest (mới nhất) | random (ngẫu nhiên) | manual (chọn thủ công).
> Config lưu Mongo (collection `home_sections`, _id="home"). Trang chủ đọc config render.

## Mapping (spec → code)
| Yêu cầu | File |
|---|---|
| Data model + resolve config | `web/lib/home-sections.ts` (mới) |
| API admin GET/PATCH config | `web/app/api/admin/home-sections/route.ts` (mới) |
| Trang admin cấu hình | `web/app/(admin)/admin/trang-chu/page.tsx` (mới) |
| UI quản lý (client) | `web/components/admin/HomeSectionsManager.tsx` (mới) |
| Card hiển thị module trên trang chủ | `web/components/home/HomeModuleCard.tsx` (mới) |
| Trang chủ đọc config render | `web/app/(site)/page.tsx` (sửa) |
| Link sidebar admin | `web/components/admin/AdminSidebar.tsx` (sửa) |

## 1. Data Layer
- [x] 1.1 `lib/home-sections.ts` — types (HomeSectionKey/Mode/Config), DEFAULTS, getHomeSections(), setHomeSections() validate/clamp
- [x] 1.2 `lib/home-sections.ts` — loadHomeSections(): resolve items mỗi khối theo mode (latest/random/manual) cho articles/jobs/lostfound/classifieds → news Article[] + HomeCard[]

## 2. API Layer
- [x] 2.1 `api/admin/home-sections/route.ts` — GET (config + candidates), PATCH (lưu config) qua requireAdmin

## 3. Admin UI
- [x] 3.1 `app/(admin)/admin/trang-chu/page.tsx` — server load config + candidates
- [x] 3.2 `components/admin/HomeSectionsManager.tsx` — toggle bật/tắt, chọn mode, limit, picker thủ công (search + checkbox)
- [x] 3.3 `AdminSidebar.tsx` — thêm link "Trang chủ" nhóm Hệ thống

## 4. Public Render
- [x] 4.1 `components/home/HomeModuleCard.tsx` — card chung (ảnh/icon + badge + title + excerpt + meta) cho jobs/lostfound/mua-ban
- [x] 4.2 `app/(site)/page.tsx` — thay JOBS/LOSTFOUND mock + thêm khối Mua bán; render theo loadHomeSections(); bỏ mảng mock

## 5. Verify
- [x] 5.1 tsc --noEmit sạch + eslint sạch các file đổi
