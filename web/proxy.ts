// Chống "load lại trang liên tục" (anti-flood) — đếm số lượt tải TRANG theo IP và theo
// user (nếu đăng nhập). Vượt ngưỡng → chặn tạm + trả trang báo spam (HTTP 429).
//
// Next 16: dùng convention "proxy" (thay cho "middleware" đã deprecated).
// LƯU Ý: bộ đếm cửa sổ trượt nằm trong RAM (Map module-global) → chỉ CHÍNH XÁC khi
// self-host 1 tiến trình (Docker/VPS, `next start`). Trên serverless/CDN nhiều instance
// biến global không chia sẻ → cần chuyển store sang Redis/Upstash.
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Có thể chỉnh qua biến môi trường.
const MAX = Number(process.env.RELOAD_MAX || "30");          // tối đa lượt tải trang của MỘT thiết bị (IP + trình duyệt)
// Trần theo IP chung: nhiều người dùng chung 1 IP (wifi quán, mạng di động CGNAT, trường học) KHÔNG bị chặn oan
// vì người khác. Chỉ chặn cả IP khi cực kỳ bất thường (nhiều thiết bị cùng bắn dồn dập).
const MAX_IP = Number(process.env.RELOAD_MAX_IP || "200");
const WINDOW_MS = Number(process.env.RELOAD_WINDOW_SEC || "10") * 1000; // trong cửa sổ (giây)
const BASE_BLOCK_MS = Number(process.env.RELOAD_BLOCK_SEC || "60") * 1000;       // chặn lần đầu (giây)
const MAX_BLOCK_MS = Number(process.env.RELOAD_BLOCK_MAX_SEC || "3600") * 1000;  // trần chặn (giây)
const OFFENSE_RESET_MS = Number(process.env.RELOAD_OFFENSE_RESET_SEC || "3600") * 1000; // ngoan đủ lâu → quên vi phạm

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

const hits = new Map<string, number[]>();              // key → mốc thời gian các lượt gần đây
const blocked = new Map<string, number>();             // key → bị chặn tới thời điểm
const offenses = new Map<string, { n: number; last: number }>(); // key → số lần bị chặn liên tiếp

function ipOf(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");
}

// Chỉ tính "mở trang" thật. Trình duyệt hiện đại gửi Sec-Fetch-Dest: document cho điều hướng; các request phụ
// (service worker, manifest, sitemap, ảnh…) có dest khác → bỏ qua. Client không gửi header này (curl, bot) vẫn được tính.
function isSubResource(req: NextRequest): boolean {
  if (req.method !== "GET") return true;
  const dest = req.headers.get("sec-fetch-dest");
  return !!dest && dest !== "document" && dest !== "iframe" && dest !== "frame";
}

// Request do Next.js/trình duyệt TỰ bắn (prefetch link + điều hướng mềm RSC), KHÔNG phải
// người dùng tải lại trang. Một lần mở trang danh sách (chợ, việc làm…) sinh ra hàng chục
// prefetch như vậy — nếu đếm chúng sẽ chặn oan. Chỉ đếm lượt tải tài liệu HTML thật.
function isPrefetchOrRsc(req: NextRequest): boolean {
  // QUAN TRỌNG (Next.js 16): tới tầng proxy thì các header nội bộ `RSC`,
  // `Next-Router-Prefetch` và query `_rsc` ĐÃ BỊ Next STRIP → đọc ra null/false,
  // KHÔNG dùng để nhận diện được. Tín hiệu còn sót lại mà proxy vẫn thấy:
  //   • RSC payload (điều hướng mềm)  → Accept: text/x-component
  //   • Prefetch (<Link> + suy đoán)  → Sec-Purpose chứa "prefetch"
  // Tài liệu HTML thật (mở trang / F5) → Accept: text/html, Sec-Fetch-Mode: navigate
  // ⇒ chỉ những lượt tải tài liệu thật mới bị tính vào bộ đếm chống-flood.
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/x-component")) return true;     // RSC payload (điều hướng mềm)
  const purpose = req.headers.get("sec-purpose") || req.headers.get("purpose") || "";
  if (purpose.includes("prefetch")) return true;            // prefetch (<Link> + suy đoán trình duyệt)

  // Fallback phòng xa — môi trường/đời Next khác có thể vẫn để lọt header/query gốc.
  if (req.headers.get("next-router-prefetch")) return true;
  if (req.headers.get("rsc")) return true;
  if (req.nextUrl.searchParams.has("_rsc")) return true;
  return false;
}

async function userId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("qp_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return String(payload.sub ?? "") || null;
  } catch {
    return null;
  }
}

// Thời gian chặn TĂNG THEO CẤP SỐ NHÂN theo số lần tái phạm: 1 → 2 → 4 → 8 … phút (trần MAX).
// Ngoan quá OFFENSE_RESET_MS không vi phạm → quên, lại tính từ lần đầu.
function nextBlockMs(key: string, now: number): number {
  const o = offenses.get(key);
  const n = o && now - o.last < OFFENSE_RESET_MS ? o.n + 1 : 1;
  offenses.set(key, { n, last: now });
  return Math.min(BASE_BLOCK_MS * 2 ** (n - 1), MAX_BLOCK_MS);
}

// Ghi 1 lượt cho key; trả về số giây còn bị chặn (>0 nếu đang/ vừa bị chặn).
function tick(key: string, now: number, max: number): number {
  const until = blocked.get(key);
  if (until) {
    if (until > now) return Math.ceil((until - now) / 1000);
    blocked.delete(key);
  }
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (arr.length > max) {
    const ms = nextBlockMs(key, now);
    blocked.set(key, now + ms);
    hits.delete(key);
    return Math.ceil(ms / 1000);
  }
  return 0;
}

// Dọn bộ nhớ định kỳ (tránh Map phình mãi khi có nhiều IP khác nhau).
let lastSweep = 0;
function sweep(now: number) {
  lastSweep = now;
  for (const [k, arr] of hits) if (!arr.length || now - arr[arr.length - 1] > WINDOW_MS) hits.delete(k);
  for (const [k, until] of blocked) if (until <= now) blocked.delete(k);
  for (const [k, o] of offenses) if (now - o.last > OFFENSE_RESET_MS) offenses.delete(k);
}

export async function proxy(req: NextRequest) {
  // Không tính prefetch/RSC/request phụ vào bộ đếm chống-flood.
  if (isSubResource(req) || isPrefetchOrRsc(req)) return NextResponse.next();

  const now = Date.now();
  if (now - lastSweep > 60_000) sweep(now);
  const uid = await userId(req);
  const ip = ipOf(req);
  // 3 tầng: (1) thiết bị = IP + trình duyệt  (2) trần chung của IP  (3) tài khoản (nếu đăng nhập).
  const ua = (req.headers.get("user-agent") || "").slice(0, 120);
  // Thiết bị đã bị chặn thì KHÔNG cộng vào trần chung của IP → một máy spam không kéo cả mạng bị chặn theo.
  let wait = tick(`d:${ip}|${ua}`, now, MAX);
  if (wait === 0) wait = tick(`ip:${ip}`, now, MAX_IP);
  if (uid && wait === 0) wait = tick(`u:${uid}`, now, MAX);

  if (wait > 0) {
    return new NextResponse(blockHtml(wait, req.nextUrl.pathname), {
      status: 429,
      headers: { "content-type": "text/html; charset=utf-8", "retry-after": String(wait) },
    });
  }
  return NextResponse.next();
}

// Chỉ áp cho điều hướng trang công khai — bỏ qua API, tài nguyên tĩnh, ảnh, và khu admin.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|img|admin|sw\.js|offline\.html|manifest\.webmanifest|robots\.txt|sitemap|feed\.xml|opengraph-image|uploads|di/).*)"],
};

function blockHtml(sec: number, path = "/"): string {
  const back = /^\/(?!\/)[A-Za-z0-9\-._~%/]*$/.test(path) ? path : "/";
  const clock = sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : String(sec);
  const human = sec >= 60
    ? `${Math.floor(sec / 60)} phút${sec % 60 ? " " + (sec % 60) + " giây" : ""}`
    : `${sec} giây`;

  // Không tải font ngoài, không ảnh nặng: trang này phải hiện tức thì dù mạng yếu. Chữ lớn, tương phản cao cho người lớn tuổi.
  return `<!doctype html><html lang="vi"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<meta name="color-scheme" content="light dark" />
<meta http-equiv="refresh" content="${sec}; url=${back}" />
<title>Vui lòng chờ một chút — Quỳnh Phụ Tôi</title>
<style>
:root{--bg:#f3f8f5;--card:#fff;--ink:#14301f;--mute:#4a6355;--line:#d6e6dc;--g1:#1a4d2e;--g2:#2d7a45;--g3:#3fa85e;--track:#e1efe6;--amber:#fff6dd;--amber-ink:#6b4a00}
@media(prefers-color-scheme:dark){:root{--bg:#0e1a13;--card:#16261c;--ink:#eaf5ee;--mute:#a9c2b3;--line:#27402f;--g1:#7fdc9c;--g2:#4cbf72;--g3:#4cbf72;--track:#244031;--amber:#33290e;--amber-ink:#f3d98a}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);
  min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;line-height:1.6}
.card{width:100%;max-width:520px;background:var(--card);border:1px solid var(--line);border-radius:24px;
  box-shadow:0 20px 60px rgba(20,60,35,.12);padding:32px 28px;text-align:center;animation:in .5s ease both}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--g1);font-weight:700;font-size:1.05rem;margin-bottom:22px}
.brand img{width:36px;height:36px;border-radius:10px}
h1{font-size:1.65rem;line-height:1.25;margin-bottom:8px;color:var(--ink)}
.sub{font-size:1.1rem;color:var(--mute);margin-bottom:24px}
.ring{position:relative;width:150px;height:150px;margin:0 auto 22px}
.ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ring .t{stroke:var(--track)}
.ring .a{stroke:var(--g3);transition:stroke-dashoffset 1s linear}
.num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.num b{font-size:2.6rem;line-height:1;color:var(--g1)}
.num span{font-size:.85rem;color:var(--mute);margin-top:4px}
.info{background:var(--amber);color:var(--amber-ink);border-radius:14px;padding:14px 16px;font-size:1.02rem;margin-bottom:24px;text-align:left}
.info b{font-weight:700}
.actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.btn{flex:1 1 180px;min-height:52px;display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:14px;
  text-decoration:none;font-size:1.05rem;font-weight:700;border:2px solid var(--g2);transition:transform .15s,box-shadow .15s}
.btn:focus-visible{outline:3px solid var(--g3);outline-offset:3px}
.btn-primary{background:var(--g2);color:#fff}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(30,100,60,.3)}
.btn-ghost{background:transparent;color:var(--g1)}
.btn-ghost:hover{background:var(--track)}
.note{font-size:.92rem;color:var(--mute);margin-top:20px}
@media(max-width:480px){.card{padding:26px 18px;border-radius:20px}h1{font-size:1.45rem}.ring{width:128px;height:128px}.num b{font-size:2.2rem}}
@media(prefers-reduced-motion:reduce){.card{animation:none}.ring .a{transition:none}}
</style></head><body>
<main class="card" role="main">
  <a class="brand" href="/" aria-label="Quỳnh Phụ Tôi — về trang chủ"><img src="/img/patterns/logo-192.webp" alt="" width="36" height="36" />Quỳnh Phụ Tôi</a>
  <h1>Bạn vui lòng chờ một chút</h1>
  <p class="sub">Trang được mở lại quá nhanh nên hệ thống tạm nghỉ vài giây.</p>

  <div class="ring" role="timer" aria-live="off">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="t" cx="60" cy="60" r="52" fill="none" stroke-width="9"/>
      <circle id="arc" class="a" cx="60" cy="60" r="52" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="326.726" stroke-dashoffset="0"/>
    </svg>
    <div class="num"><b id="cd">${clock}</b><span>${sec >= 60 ? "phút" : "giây"}</span></div>
  </div>

  <p class="info">Chờ khoảng <b>${human}</b>, trang sẽ <b>tự mở lại</b> — bạn không cần bấm gì. Xin đừng bấm tải lại liên tục, thời gian chờ sẽ lâu hơn.</p>

  <div class="actions">
    <a class="btn btn-primary" href="${back}">Thử lại</a>
    <a class="btn btn-ghost" href="/">Về trang chủ</a>
  </div>
  <p class="note">Việc này giúp trang luôn chạy nhanh cho mọi người. Nếu bạn thấy nhầm lẫn, hãy thử lại sau ít phút.</p>
</main>
<script>
(function(){
  var total=${sec},s=${sec},C=326.726,back=${JSON.stringify(back)},
      num=document.getElementById('cd'),arc=document.getElementById('arc');
  function fmt(x){return x>=60?(Math.floor(x/60)+':'+String(x%60).padStart(2,'0')):String(x);}
  var t=setInterval(function(){
    s--;
    if(num)num.textContent=fmt(s>0?s:0);
    if(arc)arc.style.strokeDashoffset=String(C*(1-Math.max(s,0)/total));
    if(s<=0){clearInterval(t);location.href=back;}
  },1000);
})();
</script>
</body></html>`;
}
