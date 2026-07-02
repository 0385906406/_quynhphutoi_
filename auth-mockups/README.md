# My Quynh Phu — Auth UI Kit

> A premium, handcrafted authentication UI kit built with pure HTML, CSS & JavaScript. Zero dependencies, zero frameworks — just clean, production-ready code.

---

## Preview

| Page | Description |
|---|---|
| `login-mockup.html` | Sign In — email + password, social login |
| `register-mockup.html` | Create Account — full registration form |
| `forgot-mockup.html` | Forgot Password — email + reCAPTCHA |
| `otp-mockup.html` | OTP Verification — 6-digit code input |
| `reset-mockup.html` | Reset Password — new password + strength meter |
| `404-mockup.html` | 404 Not Found — elegant error page |

---

## What's Included

```
auth-mockups/
├── login-mockup.html
├── register-mockup.html
├── forgot-mockup.html
├── otp-mockup.html
├── reset-mockup.html
├── 404-mockup.html
└── README.md
```

**6 standalone HTML files** — each page is fully self-contained. No build step, no npm install, no config. Open in a browser and it works.

---

## Features

### Design
- **Nature-inspired aesthetic** — animated SVG leaf art with wind, sheen sweep, and vein-draw animations
- **Two-panel desktop layout** — content on the left, decorative leaf panel on the right (or vice versa per page)
- **Mobile-first responsive** — full-screen layout with green radial-gradient header and white bottom panel
- **Smooth entrance animations** — card slide-up + form panel reveal on load
- **Consistent design language** — unified color palette, typography, and spacing across all 6 pages

### Typography & Colors
- **Cormorant Garamond** — serif for titles (elegant, editorial feel)
- **DM Sans** — sans-serif for body text (clean, modern)
- Custom green palette: `#1a4d2e` → `#5ec47a`

### Interactions & Validation
- **Smart OTP input** — auto-advance on digit entry, backspace to go back, paste support, lock after completion, shake + red highlight on wrong code
- **Password visibility toggle** — eye icon on all password fields
- **Password strength meter** — 4-level bar (Weak → Fair → Good → Strong) on Reset page
- **Frontend form validation** — real-time red error messages below each field, border highlight on error, auto-clear on correction
- **Success states** — animated success panels with transitions on Forgot, OTP, and Reset pages
- **reCAPTCHA placeholder** — realistic checkbox widget on Forgot and Reset pages
- **Resend OTP countdown** — 60-second timer with resend button

### Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari & Android Chrome tested
- Supports `safe-area-inset` for iPhone notch/home indicator
- `prefers-reduced-motion` respected — animations disabled for accessibility

---

## How to Use

### 1. Open directly
```
Double-click any .html file → opens in your default browser
```

### 2. Local server (recommended)
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code
Install "Live Server" extension → Right-click → Open with Live Server
```

### 3. Navigation flow
Pages are linked together out of the box:

```
Login ──→ Register
  │
  └──→ Forgot Password ──→ OTP Verification ──→ Reset Password ──→ Login
```

### 4. Customization
All styles live in a `<style>` block inside each file. Key variables at the top:

```css
:root {
  --g1: #1a4d2e;   /* darkest green */
  --g2: #2d7a45;
  --g3: #3fa85e;
  --g4: #5ec47a;   /* lightest green */
}
```

Change these 4 values to instantly re-theme every element on the page.

---

## Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Semantic structure |
| CSS3 | Flexbox layout, custom properties, keyframe animations |
| Vanilla JavaScript | OTP logic, form validation, password toggle, strength meter |
| Google Fonts | Cormorant Garamond + DM Sans (loaded via CDN) |
| SVG | Inline leaf illustration with CSS animations |

**No frameworks. No libraries. No build tools.**

---

## Browser Support

| Browser | Version |
|---|---|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Android | 90+ |

---

## File Size

Each file is a single self-contained HTML document:

| File | Size (approx.) |
|---|---|
| login-mockup.html | ~18 KB |
| register-mockup.html | ~20 KB |
| forgot-mockup.html | ~18 KB |
| otp-mockup.html | ~20 KB |
| reset-mockup.html | ~21 KB |
| 404-mockup.html | ~15 KB |

No external assets. No images. No icon fonts. Everything is inline SVG or CSS.

---

## License

This item is licensed for use in **one end product** (personal or commercial). You may:
- Use in client projects
- Modify the code freely
- Use as a starting point for production apps

You may **not**:
- Redistribute or resell the source files
- Include in a template/theme marketplace item without an Extended License

---

## Support & Contact

**Made by NguyenVietDuong**

For questions, customization requests, or bug reports, please contact via the marketplace messaging system.

---

*Thank you for your purchase!*
