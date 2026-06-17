// Che số giấy tờ tuỳ thân trong bài đăng do NGƯỜI DÙNG gửi (client).
//   - maskIdNumbers / maskIdNumbersInHtml: che dãy ĐÚNG 12 số (CCCD/GPLX) hoặc
//     9 số (CMND) → chỉ giữ 3 số đầu + 4 số cuối, phần giữa thay bằng "****".
//   - hasIdNumber: phát hiện trong văn bản có số giấy tờ hay không (để báo admin).
//
// KHÔNG quét từ khoá theo chủ đề. Từ ngữ thô tục dùng bộ lọc riêng lib/profanity.ts
// (danh sách trong DB, admin sửa ở /admin/loc-tu-ngu).

// Dãy ĐÚNG 9 (CMND) hoặc 12 (CCCD/GPLX) chữ số liền nhau, không nằm trong dãy số
// dài hơn (nhờ lookbehind/lookahead) → tránh che số điện thoại (10–11 số) và mã dài.
const ID_RE = /(?<!\d)(\d{12}|\d{9})(?!\d)/g;

function maskRun(run: string): string {
  return `${run.slice(0, 3)}****${run.slice(-4)}`;
}

// Che số giấy tờ trong văn bản thuần.
export function maskIdNumbers(text: string): string {
  if (!text) return text;
  return text.replace(ID_RE, (m) => maskRun(m));
}

// Che số giấy tờ trong HTML nhưng CHỈ ở phần văn bản hiển thị (ngoài thẻ/thuộc tính),
// tránh phá link ảnh (vd version Cloudinary) hay thuộc tính chứa số.
export function maskIdNumbersInHtml(html: string): string {
  if (!html) return html;
  let out = "";
  let buf = "";
  let inTag = false;
  for (const ch of html) {
    if (inTag) {
      out += ch;
      if (ch === ">") inTag = false;
    } else if (ch === "<") {
      out += maskIdNumbers(buf);
      buf = "";
      out += ch;
      inTag = true;
    } else {
      buf += ch;
    }
  }
  out += maskIdNumbers(buf);
  return out;
}

// Có chứa số giấy tờ tuỳ thân (9 hoặc 12 số) hay không.
export function hasIdNumber(text: string): boolean {
  if (!text) return false;
  ID_RE.lastIndex = 0;
  return ID_RE.test(text);
}
