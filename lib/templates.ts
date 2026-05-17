const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

const GOLD = "#C4A042";

function accent(text: string): string {
  return (text || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${GOLD};">$1</span>`);
}

/* Real UPFLU logo — served from /upflu-logo.png (public folder).
   The iframe uses sandbox="allow-same-origin" so relative URLs resolve correctly. */
function topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:48px;width:auto;object-fit:contain;" alt="UPFLU" />
    <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.18em;font-family:Inter,sans-serif;">${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
  </div>`;
}

function bottomBar() {
  return `<div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:24px;display:flex;align-items:center;gap:12px;position:relative;z-index:2;">
    <div style="width:28px;height:2px;background:${GOLD};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.28);letter-spacing:0.08em;font-family:Inter,sans-serif;">@upflu.digital</span>
  </div>`;
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

/* ═══════════════════════════════════════════════════════════════
   STYLE 0 — DARK TECH
   Dot grid • Gold orbs • Corner accents • Bar charts
   ═══════════════════════════════════════════════════════════════ */

function capa0(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;right:-140px;top:260px;width:840px;height:840px;background:radial-gradient(circle,rgba(196,160,66,0.09) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:60px;top:360px;width:480px;height:480px;border:1px solid rgba(196,160,66,0.09);border-radius:50%;"></div>
  <div style="position:absolute;right:160px;top:460px;width:280px;height:280px;border:1px solid rgba(196,160,66,0.06);border-radius:50%;"></div>
  <div style="position:absolute;top:0;right:0;width:140px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:140px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:140px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:140px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0 48px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:32px;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:108px;font-weight:900;color:#FFFFFF;line-height:0.90;letter-spacing:-0.05em;margin-bottom:44px;max-width:820px;">${accent(s.title)}</h1>
      ${s.subtitle ? `<div style="display:flex;align-items:center;gap:16px;"><div style="width:3px;height:100%;background:${GOLD};border-radius:2px;align-self:stretch;flex-shrink:0;"></div><p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.55;max-width:580px;">${s.subtitle}</p></div>` : ""}
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function numero0(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:-80px;bottom:80px;font-size:560px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.07em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:absolute;right:72px;bottom:120px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
    <div style="width:48px;height:160px;background:rgba(196,160,66,0.06);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:260px;background:rgba(196,160,66,0.10);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:200px;background:rgba(196,160,66,0.07);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:360px;background:rgba(196,160,66,0.15);border-radius:6px 6px 0 0;"></div>
    <div style="width:48px;height:300px;background:rgba(196,160,66,0.10);border-radius:6px 6px 0 0;"></div>
  </div>
  <div style="position:absolute;top:0;right:0;width:140px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:140px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:40px;"></div>
      <p style="font-size:196px;font-weight:900;color:${GOLD};line-height:0.82;letter-spacing:-0.06em;margin-bottom:40px;">${s.number || ""}</p>
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:40px;overflow:hidden;"><div style="width:74%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.3));border-radius:2px;"></div></div>
      <h2 style="font-size:54px;font-weight:900;color:#FFFFFF;line-height:1.0;letter-spacing:-0.035em;margin-bottom:28px;max-width:720px;">${accent(s.title)}</h2>
      <p style="font-size:22px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:680px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function texto0(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:0;top:0;width:5px;height:55%;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0) 100%);"></div>
  <svg style="position:absolute;right:0;bottom:80px;z-index:1;pointer-events:none;" width="500" height="320" viewBox="0 0 500 320" fill="none">
    <polyline points="40,280 130,220 220,170 310,100 420,45" stroke="rgba(196,160,66,0.12)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="420" cy="45" r="7" fill="rgba(196,160,66,0.2)"/>
    <circle cx="310" cy="100" r="4" fill="rgba(196,160,66,0.12)"/>
    <circle cx="220" cy="170" r="4" fill="rgba(196,160,66,0.10)"/>
  </svg>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.04em;margin-bottom:40px;max-width:860px;">${accent(s.title)}</h2>
      <div style="width:52px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:36px;"></div>
      <p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:780px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function destaque0(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0C0A04;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.2);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.055) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:900px;height:900px;background:radial-gradient(circle,rgba(196,160,66,0.055) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:-10px;top:20px;font-size:680px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <div style="position:absolute;top:0;left:0;width:140px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:140px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:140px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:140px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:52px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:52px;"></div>
      <h2 style="font-size:88px;font-weight:900;color:#FFFFFF;line-height:0.92;letter-spacing:-0.045em;margin-bottom:44px;max-width:860px;">${s.title}</h2>
      <p style="font-size:28px;font-weight:500;color:rgba(196,160,66,0.72);line-height:1.5;max-width:720px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   STYLE 1 — EDITORIAL BOLD
   Light cream panels • Strong typographic contrast • Minimal deco
   ═══════════════════════════════════════════════════════════════ */

function capa1(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Gold diagonal strip top-right -->
  <div style="position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:${GOLD};transform:rotate(45deg);opacity:0.07;"></div>
  <div style="position:absolute;top:-30px;right:-30px;width:260px;height:260px;background:${GOLD};transform:rotate(45deg);opacity:0.06;"></div>
  <!-- Large background text -->
  <div style="position:absolute;right:-20px;bottom:60px;font-size:320px;font-weight:900;color:rgba(196,160,66,0.05);line-height:1;letter-spacing:-0.05em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <!-- Gold left panel strip -->
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:60px;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:6px 18px;border-radius:4px;margin-bottom:36px;align-self:flex-start;"><p style="font-size:12px;font-weight:900;color:#0D0D0D;letter-spacing:0.35em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h1 style="font-size:120px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.06em;margin-bottom:48px;max-width:900px;">${accent(s.title)}</h1>
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="width:60px;height:3px;background:${GOLD};border-radius:2px;"></div>
        ${s.subtitle ? `<p style="font-size:22px;font-weight:400;color:rgba(255,255,255,0.38);line-height:1.5;max-width:560px;">${s.subtitle}</p>` : ""}
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function numero1(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Horizontal gold rule top third -->
  <div style="position:absolute;top:420px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(196,160,66,0.2),transparent);"></div>
  <!-- Abstract circle -->
  <div style="position:absolute;right:-160px;top:-160px;width:640px;height:640px;border:1px solid rgba(196,160,66,0.08);border-radius:50%;"></div>
  <div style="position:absolute;right:-80px;top:-80px;width:400px;height:400px;border:1px solid rgba(196,160,66,0.06);border-radius:50%;"></div>
  <!-- Left panel strip -->
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <!-- Number block with colored bg -->
      <div style="background:rgba(196,160,66,0.08);border:1px solid rgba(196,160,66,0.15);border-radius:16px;padding:32px 40px;margin-bottom:48px;display:inline-block;align-self:flex-start;">
        <p style="font-size:180px;font-weight:900;color:${GOLD};line-height:0.85;letter-spacing:-0.06em;">${s.number || ""}</p>
      </div>
      <h2 style="font-size:58px;font-weight:900;color:#FFFFFF;line-height:1.0;letter-spacing:-0.03em;margin-bottom:32px;max-width:760px;">${accent(s.title)}</h2>
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="width:3px;background:${GOLD};border-radius:2px;flex-shrink:0;margin-top:4px;align-self:stretch;"></div>
        <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:680px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function texto1(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Diagonal grid overlay -->
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.025) 0px,rgba(196,160,66,0.025) 1px,transparent 1px,transparent 60px);"></div>
  <!-- Left panel strip -->
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <!-- Large abstract number/icon top-right -->
  <div style="position:absolute;right:60px;top:80px;font-size:280px;font-weight:900;color:rgba(196,160,66,0.06);line-height:1;letter-spacing:-0.06em;pointer-events:none;">${n}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:5px 16px;border-radius:4px;margin-bottom:32px;align-self:flex-start;"><p style="font-size:11px;font-weight:900;color:#0D0D0D;letter-spacing:0.35em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h2 style="font-size:84px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.04em;margin-bottom:48px;max-width:880px;">${accent(s.title)}</h2>
      <p style="font-size:25px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:780px;border-left:3px solid ${GOLD};padding-left:24px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function destaque1(s: SlideContent, n: number, total: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Full-width gold strip at top -->
  <div style="position:absolute;top:0;left:0;right:0;height:8px;background:${GOLD};"></div>
  <!-- Large decorative quote block -->
  <div style="position:absolute;left:72px;top:120px;font-size:160px;font-weight:900;color:rgba(196,160,66,0.15);line-height:1;font-family:Georgia,serif;">"</div>
  <!-- Diagonal lines -->
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(196,160,66,0.02) 0px,rgba(196,160,66,0.02) 1px,transparent 1px,transparent 80px);"></div>
  <!-- Left panel strip -->
  <div style="position:absolute;left:0;top:8px;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.08) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:80px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <h2 style="font-size:92px;font-weight:900;color:#FFFFFF;line-height:0.92;letter-spacing:-0.045em;margin-bottom:48px;max-width:880px;">${s.title}</h2>
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:0;">
        <div style="width:60px;height:3px;background:${GOLD};border-radius:2px;flex-shrink:0;"></div>
        <p style="font-size:27px;font-weight:500;color:rgba(196,160,66,0.7);line-height:1.5;max-width:700px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   CTA — shared between both styles (2 variants)
   ═══════════════════════════════════════════════════════════════ */

function cta0(s: SlideContent): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.15);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:960px;height:960px;background:radial-gradient(circle,rgba(196,160,66,0.06) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;left:-40px;bottom:40px;font-size:260px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.04em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <div style="position:absolute;top:0;left:0;width:140px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:140px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;right:0;width:140px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:140px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:140px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:140px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:140px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:140px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:90px;width:auto;object-fit:contain;margin-bottom:72px;" alt="UPFLU" />
    <div style="width:52px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:60px;"></div>
    <h2 style="font-size:72px;font-weight:900;color:#FFFFFF;line-height:0.95;letter-spacing:-0.04em;margin-bottom:56px;max-width:820px;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:18px 52px;margin-bottom:36px;">
      <p style="font-size:22px;font-weight:800;color:#0D0D0D;letter-spacing:0.05em;">${s.handle || "@upflu.digital"}</p>
    </div>
    <p style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
}

function cta1(s: SlideContent): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:8px;background:${GOLD};"></div>
  <div style="position:absolute;left:0;top:8px;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.02) 0px,rgba(196,160,66,0.02) 1px,transparent 1px,transparent 60px);"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(196,160,66,0.05) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px 80px 80px 100px;text-align:center;">
    <img src="/upflu-logo.png" style="height:90px;width:auto;object-fit:contain;margin-bottom:64px;" alt="UPFLU" />
    <h2 style="font-size:76px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.04em;margin-bottom:52px;max-width:820px;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:20px 56px;margin-bottom:40px;">
      <p style="font-size:24px;font-weight:800;color:#0D0D0D;letter-spacing:0.06em;">${s.handle || "@upflu.digital"}</p>
    </div>
    <p style="font-size:16px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════════════
   Public render function — variant 0 = DARK TECH, 1 = EDITORIAL
   ═══════════════════════════════════════════════════════════════ */

export function renderSlide(
  s: SlideContent,
  n: number,
  total: number,
  variant = 0
): string {
  const v = variant % 2;
  switch (s.type) {
    case "capa":    return v === 0 ? capa0(s, n, total) : capa1(s, n, total);
    case "numero":  return v === 0 ? numero0(s, n, total) : numero1(s, n, total);
    case "texto":   return v === 0 ? texto0(s, n, total) : texto1(s, n, total);
    case "destaque":return v === 0 ? destaque0(s, n, total) : destaque1(s, n, total);
    case "cta":
    default:        return v === 0 ? cta0(s) : cta1(s);
  }
}
