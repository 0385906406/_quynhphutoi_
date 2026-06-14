// Giới hạn upload ảnh — DÙNG CHUNG cho client (ImageUploader) và server (/api/upload)
// để hai bên không bao giờ lệch số. File thuần hằng số, không import server-only nên
// an toàn để import từ component "use client".

export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// Số ảnh tối đa xử lý trong MỘT request upload.
export const MAX_FILES_PER_UPLOAD = 8;

// Loại ảnh cho phép (MIME).
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

// Chuỗi cho thuộc tính accept của <input type="file">.
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

export function isAllowedImageType(type: string): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(type);
}

// Định dạng dung lượng để hiện trong thông báo lỗi (vd "6.3MB").
export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
