// Quy tắc mật khẩu dùng chung: tối thiểu 8 ký tự, có cả chữ và số.
export function validatePassword(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (pw.length > 100) return "Mật khẩu quá dài.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}
