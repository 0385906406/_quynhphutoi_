// Layout riêng cho khối xác thực — KHÔNG chrome.
// Nạp đúng font bản gốc (Cormorant Garamond + DM Sans) để family literal
// trong auth.css resolve chuẩn. React 19 tự hoist <link> lên <head>.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
