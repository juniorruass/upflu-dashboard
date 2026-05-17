const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

const GOLD = "#C4A042";
const GOLD_MID = "rgba(196,160,66,0.14)";
const GOLD_LOW = "rgba(196,160,66,0.06)";

function accent(text: string): string {
  return (text || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${GOLD};">$1</span>`);
}

/* SVG approximation of the UPFLU icon (U + arrow up + wave) */
function logoIcon(size = 40): string {
  const h = Math.round(size * 1.15);
  return `<svg width="${size}" height="${h}" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4 L5 26 Q5 40 20 40 Q35 40 35 26 L35 4" stroke="rgba(255,255,255,0.88)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="20" y1="34" x2="20" y2="13" stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M13 20 L20 12 L27 20" stroke="${GOLD}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 38 Q14.5 32 20 38 Q25.5 44 31 38" stroke="rgba(255,255,255,0.55)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <div style="display:flex;align-items:center;gap:13px;">
      ${logoIcon(38)}
      <span style="font-size:20px;font-weight:900;color:#FFFFFF;letter-spacing:0.06em;font-family:Inter,sans-serif;">UPFLU</span>
    </div>
    <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.18em;font-family:Inter,sans-serif;">${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
  </div>`;
}

function bottomBar() {
  return `<div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;display:flex;align-items:center;gap:12px;position:relative;z-index:2;">
    <div style="width:28px;height:2px;background:${GOLD};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.28);letter-spacing:0.08em;font-family:Inter,sans-serif;">@upflu.digital</span>
  </div>`;
}

/* CSS-only bar chart decoration */
const barChart = `<div style="position:absolute;right:72px;bottom:120px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
  <div style="width:48px;height:160px;background:${GOLD_LOW};border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:260px;background:${GOLD_MID};border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:200px;background:${GOLD_LOW};border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:360px;background:rgba(196,160,66,0.18);border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:300px;background:${GOLD_MID};border-radius:6px 6px 0 0;"></div>
</div>`;

/* SVG trend line (upward graph) */
const trendLine = `<svg style="position:absolute;right:0;bottom:80px;z-index:1;pointer-events:none;" width="500" height="320" viewBox="0 0 500 320" fill="none">
  <polyline points="40,280 130,220 220,180 310,110 420,50" stroke="rgba(196,160,66,0.14)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="420" cy="50" r="6" fill="rgba(196,160,66,0.22)"/>
</svg>`;

/* Corner accent helper */
function corners(dark = true) {
  const c = dark ? GOLD : "rgba(196,160,66,0.6)";
  return `
  <div style="position:absolute;top:0;right:0;width:120px;height:3px;background:linear-gradient(90deg,transparent,${c});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:120px;background:linear-gradient(180deg,${c},transparent);"></div>`;
}

export interface SlideContent {
  type: "capa" | "numero" | "texto" | "destaque" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  number?: string;
  handle?: string;
}

export function renderSlide(s: SlideContent, n: number, total: number): string {
  switch (s.type) {

    /* ── SLIDE 1: CAPA ─────────────────────────────────────────────── */
    case "capa":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Gold glow orbs -->
  <div style="position:absolute;right:-140px;top:260px;width:840px;height:840px;background:radial-gradient(circle,rgba(196,160,66,0.08) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:60px;top:350px;width:480px;height:480px;border:1px solid rgba(196,160,66,0.09);border-radius:50%;"></div>
  <div style="position:absolute;right:160px;top:460px;width:280px;height:280px;border:1px solid rgba(196,160,66,0.06);border-radius:50%;"></div>
  <div style="position:absolute;right:220px;top:520px;width:160px;height:160px;background:rgba(196,160,66,0.04);border-radius:50%;"></div>
  ${corners()}
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:64px 0 52px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.38em;text-transform:uppercase;margin-bottom:32px;font-family:Inter,sans-serif;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:104px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.05em;margin-bottom:44px;max-width:800px;font-family:Inter,sans-serif;">${accent(s.title)}</h1>
      ${s.subtitle ? `<p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.55;max-width:620px;font-family:Inter,sans-serif;">${s.subtitle}</p>` : ""}
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;

    /* ── SLIDE 2 & 5: NUMERO ───────────────────────────────────────── */
    case "numero":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Ghost watermark number -->
  <div style="position:absolute;left:-80px;bottom:100px;font-size:560px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.07em;font-family:Inter,sans-serif;pointer-events:none;white-space:nowrap;">${s.number || ""}</div>
  ${barChart}
  ${corners()}
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:40px;"></div>
      <p style="font-size:196px;font-weight:900;color:${GOLD};line-height:0.82;letter-spacing:-0.06em;margin-bottom:44px;font-family:Inter,sans-serif;">${s.number || ""}</p>
      <!-- Progress bar (decorative) -->
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:44px;overflow:hidden;">
        <div style="width:72%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.3));border-radius:2px;"></div>
      </div>
      <h2 style="font-size:54px;font-weight:900;color:#FFFFFF;line-height:1.0;letter-spacing:-0.035em;margin-bottom:28px;max-width:720px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
      <p style="font-size:22px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:680px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;

    /* ── SLIDE 3: TEXTO ────────────────────────────────────────────── */
    case "texto":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Left vertical gold accent -->
  <div style="position:absolute;left:0;top:0;width:5px;height:60%;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0) 100%);"></div>
  ${trendLine}
  <!-- Bottom-left corner accent -->
  <div style="position:absolute;bottom:0;left:0;width:120px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:120px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.38em;text-transform:uppercase;margin-bottom:28px;font-family:Inter,sans-serif;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.04em;margin-bottom:40px;max-width:860px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
      <div style="width:52px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:36px;"></div>
      <p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:780px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;

    /* ── SLIDE 4: DESTAQUE ─────────────────────────────────────────── */
    case "destaque":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0C0A04;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.2);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.06) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Large gold glow center -->
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:900px;height:900px;background:radial-gradient(circle,rgba(196,160,66,0.06) 0%,transparent 60%);border-radius:50%;"></div>
  <!-- Large quote mark -->
  <div style="position:absolute;right:-20px;top:20px;font-size:680px;font-weight:900;color:rgba(196,160,66,0.05);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <!-- Gold bar chart (subtle) -->
  <div style="position:absolute;left:72px;bottom:120px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
    <div style="width:48px;height:120px;background:rgba(196,160,66,0.07);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:200px;background:rgba(196,160,66,0.10);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:160px;background:rgba(196,160,66,0.07);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:280px;background:rgba(196,160,66,0.12);border-radius:6px 6px 0 0;"></div>
  </div>
  <!-- Corner accents -->
  <div style="position:absolute;top:0;left:0;width:120px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:120px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:120px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:120px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:52px;"></div>
      <h2 style="font-size:88px;font-weight:900;color:#FFFFFF;line-height:0.92;letter-spacing:-0.045em;margin-bottom:44px;max-width:860px;font-family:Inter,sans-serif;">${s.title}</h2>
      <p style="font-size:28px;font-weight:500;color:rgba(196,160,66,0.75);line-height:1.5;max-width:720px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;

    /* ── SLIDE 6: CTA ──────────────────────────────────────────────── */
    case "cta":
    default:
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Center glow -->
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:960px;height:960px;background:radial-gradient(circle,rgba(196,160,66,0.06) 0%,transparent 60%);border-radius:50%;"></div>
  <!-- Ghost UPFLU watermark -->
  <div style="position:absolute;left:-40px;bottom:40px;font-size:240px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.04em;font-family:Inter,sans-serif;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <!-- Corner accents all 4 -->
  <div style="position:absolute;top:0;left:0;width:120px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:120px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;right:0;width:120px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:120px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:120px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:120px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:120px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:120px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    ${logoIcon(64)}
    <span style="font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:0.06em;margin-top:16px;margin-bottom:72px;font-family:Inter,sans-serif;">UPFLU</span>
    <div style="width:52px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:60px;"></div>
    <h2 style="font-size:72px;font-weight:900;color:#FFFFFF;line-height:0.95;letter-spacing:-0.04em;margin-bottom:56px;max-width:820px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:18px 52px;margin-bottom:36px;">
      <p style="font-size:22px;font-weight:800;color:#0D0D0D;letter-spacing:0.05em;font-family:Inter,sans-serif;">${s.handle || "@upflu.digital"}</p>
    </div>
    <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;font-family:Inter,sans-serif;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
  }
}
