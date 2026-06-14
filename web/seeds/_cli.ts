// Phát hiện script seed có đang chạy trực tiếp bằng CLI (node seeds/x.ts) hay không.
// Dùng để chặn main() KHÔNG tự chạy (wipe + reseed) khi file bị import từ app
// (orchestrator lib/seed.ts chỉ cần seedDocs()).
import { fileURLToPath } from "node:url";
import path from "node:path";

export function isCli(metaUrl: string): boolean {
  try {
    return !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);
  } catch {
    return false;
  }
}
