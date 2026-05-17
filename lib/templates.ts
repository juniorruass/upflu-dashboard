const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

function accent(text: string): string {
  return (text || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:#00C896;">$1</span>`);
}

function topBar(n: number, total: number, theme: "dark" | "green") {
  const isDark = theme === "dark";
  const boxBg = isDark ? "#00C896" : "#0a3d2a";
  const uColor = isDark ? "#0D0D0D" : "#00C896";
  const textColor = isDark ? "#FFFFFF" : "#0a1f17";
  const accentSpan = isDark ? "#00C896" : "#0a1f17";
  const counter = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)";
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:34px;height:34px;background:${boxBg};border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:15px;font-weight:900;color:${uColor};font-family:Inter,sans-serif;">U</span>
      </div>
      <span style="font-size:18px;font-weight:900;color:${textColor};letter-spacing:-0.02em;font-family:Inter,sans-serif;">UP<span style="color:${accentSpan};">FLU</span></span>
    </div>
    <span style="font-size:13px;font-weight:700;color:${counter};letter-spacing:0.18em;font-family:Inter,sans-serif;">${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
  </div>`;
}

function bottomBar(theme: "dark" | "green") {
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const line = isDark ? "#00C896" : "#0a3d2a";
  const text = isDark ? "rgba(255,255,255,0.28)" : "#0a5c43";
  return `<div style="border-top:1px solid ${border};padding-top:24px;display:flex;align-items:center;gap:12px;position:relative;z-index:2;">
    <div style="width:28px;height:2px;background:${line};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:600;color:${text};letter-spacing:0.08em;font-family:Inter,sans-serif;">@upflu.digital</span>
  </div>`;
}

/* Decorative bar-chart — 5 bars, right-side, bottom-aligned */
const barChart = `<div style="position:absolute;right:72px;bottom:120px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
  <div style="width:48px;height:160px;background:rgba(0,200,150,0.08);border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:260px;background:rgba(0,200,150,0.10);border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:200px;background:rgba(0,200,150,0.08);border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:360px;background:rgba(0,200,150,0.14);border-radius:6px 6px 0 0;"></div>
  <div style="width:48px;height:300px;background:rgba(0,200,150,0.10);border-radius:6px 6px 0 0;"></div>
</div>`;

/* Decorative upward-trend arrow (line graph) */
const trendLine = `<svg style="position:absolute;right:0;bottom:80px;z-index:1;pointer-events:none;" width="500" height="320" viewBox="0 0 500 320" fill="none">
  <polyline points="40,280 130,220 220,180 310,110 420,50" stroke="rgba(0,200,150,0.12)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="420" cy="50" r="6" fill="rgba(0,200,150,0.18)"/>
</svg>`;

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

    /* ── SLIDE 1: CAPA ─────────────────────────────────────────────────── */
    case "capa":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(0,200,150,0.12);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Glow orbs -->
  <div style="position:absolute;right:-140px;top:260px;width:840px;height:840px;background:radial-gradient(circle,rgba(0,200,150,0.10) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:60px;top:350px;width:480px;height:480px;border:1px solid rgba(0,200,150,0.10);border-radius:50%;"></div>
  <div style="position:absolute;right:160px;top:450px;width:280px;height:280px;border:1px solid rgba(0,200,150,0.07);border-radius:50%;"></div>
  <div style="position:absolute;right:220px;top:510px;width:160px;height:160px;background:rgba(0,200,150,0.05);border-radius:50%;"></div>
  <!-- Corner accent top-right -->
  <div style="position:absolute;top:0;right:0;width:120px;height:4px;background:linear-gradient(90deg,transparent,#00C896);"></div>
  <div style="position:absolute;top:0;right:0;width:4px;height:120px;background:linear-gradient(180deg,#00C896,transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total, "dark")}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:64px 0 52px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:#00C896;letter-spacing:0.38em;text-transform:uppercase;margin-bottom:32px;font-family:Inter,sans-serif;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:104px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.05em;margin-bottom:44px;max-width:800px;font-family:Inter,sans-serif;">${accent(s.title)}</h1>
      ${s.subtitle ? `<p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.4);line-height:1.55;max-width:600px;font-family:Inter,sans-serif;">${s.subtitle}</p>` : ""}
    </div>
    ${bottomBar("dark")}
  </div>
</div></body></html>`;

    /* ── SLIDE 2 & 5: NUMERO ───────────────────────────────────────────── */
    case "numero":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(0,200,150,0.12);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Ghost watermark number -->
  <div style="position:absolute;left:-80px;bottom:100px;font-size:560px;font-weight:900;color:rgba(0,200,150,0.04);line-height:1;letter-spacing:-0.07em;font-family:Inter,sans-serif;pointer-events:none;white-space:nowrap;">${s.number || ""}</div>
  <!-- Bar chart decoration -->
  ${barChart}
  <!-- Corner accents -->
  <div style="position:absolute;top:0;right:0;width:120px;height:4px;background:linear-gradient(90deg,transparent,#00C896);"></div>
  <div style="position:absolute;top:0;right:0;width:4px;height:120px;background:linear-gradient(180deg,#00C896,transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total, "dark")}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:#00C896;border-radius:3px;margin-bottom:40px;"></div>
      <p style="font-size:196px;font-weight:900;color:#00C896;line-height:0.82;letter-spacing:-0.06em;margin-bottom:44px;font-family:Inter,sans-serif;">${s.number || ""}</p>
      <!-- Progress bar (decorative) -->
      <div style="width:100%;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:44px;overflow:hidden;">
        <div style="width:72%;height:100%;background:linear-gradient(90deg,#00C896,rgba(0,200,150,0.4));border-radius:2px;"></div>
      </div>
      <h2 style="font-size:54px;font-weight:900;color:#FFFFFF;line-height:1.0;letter-spacing:-0.035em;margin-bottom:28px;max-width:720px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
      <p style="font-size:22px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:680px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar("dark")}
  </div>
</div></body></html>`;

    /* ── SLIDE 3: TEXTO ────────────────────────────────────────────────── */
    case "texto":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(0,200,150,0.12);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Left vertical accent -->
  <div style="position:absolute;left:0;top:0;width:6px;height:60%;background:linear-gradient(180deg,#00C896 0%,rgba(0,200,150,0) 100%);"></div>
  <!-- Trend line decoration -->
  ${trendLine}
  <!-- Corner accents -->
  <div style="position:absolute;bottom:0;left:0;width:120px;height:4px;background:linear-gradient(90deg,#00C896,transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:4px;height:120px;background:linear-gradient(0deg,#00C896,transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total, "dark")}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:#00C896;letter-spacing:0.38em;text-transform:uppercase;margin-bottom:28px;font-family:Inter,sans-serif;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.04em;margin-bottom:40px;max-width:860px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
      <div style="width:52px;height:4px;background:#00C896;border-radius:2px;margin-bottom:36px;"></div>
      <p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:780px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar("dark")}
  </div>
</div></body></html>`;

    /* ── SLIDE 4: DESTAQUE ─────────────────────────────────────────────── */
    case "destaque":
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#00C896;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,0.07) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Large quote mark -->
  <div style="position:absolute;right:-10px;top:30px;font-size:680px;font-weight:900;color:rgba(0,0,0,0.05);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <!-- Bar chart (dark tones) -->
  <div style="position:absolute;left:72px;bottom:120px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
    <div style="width:48px;height:140px;background:rgba(0,0,0,0.06);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:220px;background:rgba(0,0,0,0.08);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:180px;background:rgba(0,0,0,0.06);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:300px;background:rgba(0,0,0,0.10);border-radius:6px 6px 0 0;"></div>
  </div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total, "green")}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:#0a3d2a;border-radius:3px;margin-bottom:52px;"></div>
      <h2 style="font-size:88px;font-weight:900;color:#0a1f17;line-height:0.92;letter-spacing:-0.045em;margin-bottom:44px;max-width:860px;font-family:Inter,sans-serif;">${s.title}</h2>
      <p style="font-size:28px;font-weight:600;color:#0a4f38;line-height:1.5;max-width:720px;font-family:Inter,sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar("green")}
  </div>
</div></body></html>`;

    /* ── SLIDE 6: CTA ──────────────────────────────────────────────────── */
    case "cta":
    default:
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,'Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(0,200,150,0.12);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);background-size:36px 36px;"></div>
  <!-- Center glow -->
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:960px;height:960px;background:radial-gradient(circle,rgba(0,200,150,0.07) 0%,transparent 60%);border-radius:50%;"></div>
  <!-- Ghost UPFLU -->
  <div style="position:absolute;left:-40px;bottom:40px;font-size:260px;font-weight:900;color:rgba(0,200,150,0.04);line-height:1;letter-spacing:-0.04em;font-family:Inter,sans-serif;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <!-- Corner accents all 4 sides -->
  <div style="position:absolute;top:0;left:0;width:120px;height:4px;background:linear-gradient(90deg,#00C896,transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:4px;height:120px;background:linear-gradient(180deg,#00C896,transparent);"></div>
  <div style="position:absolute;top:0;right:0;width:120px;height:4px;background:linear-gradient(90deg,transparent,#00C896);"></div>
  <div style="position:absolute;top:0;right:0;width:4px;height:120px;background:linear-gradient(180deg,#00C896,transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:120px;height:4px;background:linear-gradient(90deg,#00C896,transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:4px;height:120px;background:linear-gradient(0deg,#00C896,transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:120px;height:4px;background:linear-gradient(90deg,transparent,#00C896);"></div>
  <div style="position:absolute;bottom:0;right:0;width:4px;height:120px;background:linear-gradient(0deg,#00C896,transparent);"></div>
  <!-- Content -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <div style="width:72px;height:72px;background:#00C896;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;flex-shrink:0;">
      <span style="font-size:30px;font-weight:900;color:#0D0D0D;font-family:Inter,sans-serif;">U</span>
    </div>
    <span style="font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:-0.02em;margin-bottom:72px;font-family:Inter,sans-serif;">UP<span style="color:#00C896;">FLU</span></span>
    <div style="width:52px;height:4px;background:#00C896;border-radius:2px;margin-bottom:60px;"></div>
    <h2 style="font-size:72px;font-weight:900;color:#FFFFFF;line-height:0.95;letter-spacing:-0.04em;margin-bottom:56px;max-width:820px;font-family:Inter,sans-serif;">${accent(s.title)}</h2>
    <div style="background:#00C896;border-radius:100px;padding:18px 48px;margin-bottom:36px;">
      <p style="font-size:22px;font-weight:800;color:#0D0D0D;letter-spacing:0.05em;font-family:Inter,sans-serif;">${s.handle || "@upflu.digital"}</p>
    </div>
    <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;font-family:Inter,sans-serif;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
  }
}
