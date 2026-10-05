// Giao diện sáng / tối — hằng số dùng chung server + client (KHÔNG "use client":
// root layout (server) cần đọc được chuỗi script, không phải client reference).
export const THEME_KEY = "qp-theme";

// Chạy trong <head> TRƯỚC khi trình duyệt vẽ trang → không nháy trắng khi đang ở giao diện tối.
// Ưu tiên lựa chọn đã lưu; chưa chọn → theo hệ điều hành; lỗi (chặn storage…) → sáng.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
