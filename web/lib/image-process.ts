// Xử lý ảnh người dùng tải lên TRƯỚC khi lưu (Cloudinary hoặc public/uploads):
//  • XOÁ siêu dữ liệu EXIF — ảnh chụp điện thoại thường chứa TOẠ ĐỘ GPS nơi chụp
//    (đăng tin tìm đồ / mua bán có thể lộ vị trí nhà người dân).
//  • Xoay đúng chiều theo EXIF Orientation (trước khi xoá EXIF).
//  • Thu về tối đa MAX_SIDE px, lưu WebP → nhẹ hơn nhiều (ảnh điện thoại 3–5MB → vài trăm KB).
//  • Giải mã thật bằng sharp → chặn tệp giả đuôi ảnh (không chỉ tin MIME trình duyệt gửi lên).
// GIF giữ nguyên (tránh mất ảnh động) nhưng vẫn kiểm tra là GIF hợp lệ.
import sharp from "sharp";

const MAX_SIDE = 2000;
const WEBP_QUALITY = 82;

export type ProcessedImage = { buf: Buffer; ext: string; contentType: string };

export class InvalidImageError extends Error {}

export async function processUploadImage(input: Buffer, mime: string): Promise<ProcessedImage> {
  const meta = await sharp(input, { failOn: "error" }).metadata().catch(() => null);
  if (!meta) throw new InvalidImageError("Tệp không phải ảnh hợp lệ.");
  if (!meta.format || !["jpeg", "png", "webp", "gif"].includes(meta.format)) {
    throw new InvalidImageError("Chỉ chấp nhận ảnh JPG/PNG/WEBP/GIF.");
  }

  if (meta.format === "gif" || mime === "image/gif") {
    return { buf: input, ext: "gif", contentType: "image/gif" };
  }

  // sharp mặc định KHÔNG giữ metadata khi xuất → EXIF/GPS/XMP bị loại bỏ.
  const buf = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { buf, ext: "webp", contentType: "image/webp" };
}
