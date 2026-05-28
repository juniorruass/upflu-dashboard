// ═══════════════════════════════════════════════════════
//  UPFLU Carousel Templates
//  4 visual variants — pure CSS, no external images
// ═══════════════════════════════════════════════════════

const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;}`;
const GOLD = "#C4A042";
const CYAN = "#00CFFF";

export interface SlideContent {
  type: "capa" | "numero" | "texto" | "destaque" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  number?: string;
  handle?: string;
}

function ag(t: string): string {
  return (t || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${GOLD}">$1</span>`);
}
function ac(t: string): string {
  return (t || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${CYAN};text-shadow:0 0 24px rgba(0,207,255,0.55)">$1</span>`);
}
function ag_glow(t: string): string {
  return (t || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${GOLD};text-shadow:0 0 32px rgba(196,160,66,0.75)">$1</span>`);
}

function pad(n: number): string { return String(n).padStart(2, "0"); }

// ─── Shared top/bottom bars ────────────────────────────────────────────────────

function topBar(n: number, total: number, logoFilter = "") {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:44px;width:auto;object-fit:contain;${logoFilter}" alt="UPFLU">
    <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.22);letter-spacing:0.22em;">${pad(n)} / ${pad(total)}</span>
  </div>`;
}

function bottomBar(handle = "@upfluagencia", accentColor = GOLD) {
  return `<div style="display:flex;align-items:center;gap:12px;border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;position:relative;z-index:2;">
    <div style="width:24px;height:2px;background:${accentColor};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.09em;">${handle}</span>
  </div>`;
}

function cyanTopBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:44px;width:auto;object-fit:contain;filter:drop-shadow(0 0 8px rgba(0,207,255,0.4));" alt="UPFLU">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:6px;height:6px;background:${CYAN};border-radius:50%;box-shadow:0 0 8px ${CYAN};"></div>
      <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:0.22em;">${pad(n)} / ${pad(total)}</span>
    </div>
  </div>`;
}

function cyanBottomBar(handle = "@upfluagencia") {
  return `<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:20px;height:1px;background:${CYAN};box-shadow:0 0 6px rgba(0,207,255,0.5);"></div>
      <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.28);letter-spacing:0.09em;">${handle}</span>
    </div>
    <span style="font-size:10px;font-weight:700;color:rgba(0,207,255,0.3);letter-spacing:0.3em;text-transform:uppercase;">UPFLU.DIGITAL</span>
  </div>`;
}

// ─── HUD frame for V3 ─────────────────────────────────────────────────────────

function hudFrame() {
  return `
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,207,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,207,255,0.025) 1px,transparent 1px);background-size:60px 60px;"></div>
  <div style="position:absolute;top:48px;left:48px;width:48px;height:48px;border-top:2px solid rgba(0,207,255,0.55);border-left:2px solid rgba(0,207,255,0.55);"></div>
  <div style="position:absolute;top:48px;right:48px;width:48px;height:48px;border-top:2px solid rgba(0,207,255,0.55);border-right:2px solid rgba(0,207,255,0.55);"></div>
  <div style="position:absolute;bottom:48px;left:48px;width:48px;height:48px;border-bottom:2px solid rgba(0,207,255,0.55);border-left:2px solid rgba(0,207,255,0.55);"></div>
  <div style="position:absolute;bottom:48px;right:48px;width:48px;height:48px;border-bottom:2px solid rgba(0,207,255,0.55);border-right:2px solid rgba(0,207,255,0.55);"></div>
  <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:1px;height:100%;background:linear-gradient(180deg,transparent 10%,rgba(0,207,255,0.08) 50%,transparent 90%);pointer-events:none;"></div>`;
}

function slide(head: string, bgStyle: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${head}<style>${BASE}</style></head><body>
<div style="width:1080px;height:1350px;${bgStyle}position:relative;overflow:hidden;">${content}</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   VARIANT 0 — DARK PRECISION
   Pure black · Dot grid · Gold accents · Left-aligned
   ═══════════════════════════════════════════════════════ */

const V0_BG = `background:#080808;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:30px 30px;`;
const V0_STRIP = `<div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.06) 100%);"></div>`;
const V0_CORNER_TR = `<div style="position:absolute;top:0;right:0;width:120px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div><div style="position:absolute;top:0;right:0;width:3px;height:120px;background:linear-gradient(180deg,${GOLD},transparent);"></div>`;

function v0_capa(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V0_BG, `
  ${V0_STRIP}${V0_CORNER_TR}
  <div style="position:absolute;right:-80px;bottom:120px;width:600px;height:600px;background:radial-gradient(circle,rgba(196,160,66,0.055) 0%,transparent 60%);border-radius:50%;pointer-events:none;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0 40px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:124px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.055em;margin-bottom:40px;max-width:880px;">${ag(s.title)}</h1>
      ${s.subtitle ? `<div style="display:flex;align-items:flex-start;gap:18px;"><div style="width:3px;flex-shrink:0;margin-top:6px;align-self:stretch;background:${GOLD};border-radius:2px;"></div><p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.5;max-width:620px;">${s.subtitle}</p></div>` : ""}
    </div>
    ${bottomBar()}
  </div>`);
}

function v0_numero(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V0_BG, `
  ${V0_STRIP}${V0_CORNER_TR}
  <div style="position:absolute;right:-20px;bottom:40px;font-size:580px;font-weight:900;color:rgba(196,160,66,0.038);line-height:1;letter-spacing:-0.08em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:48px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:32px;"></div>
      <p style="font-size:248px;font-weight:900;color:${GOLD};line-height:0.80;letter-spacing:-0.07em;margin-bottom:32px;">${s.number || ""}</p>
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:32px;overflow:hidden;"><div style="width:70%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.2));border-radius:2px;"></div></div>
      <h2 style="font-size:62px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:24px;max-width:740px;">${ag(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.65;max-width:700px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v0_texto(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V0_BG, `
  ${V0_STRIP}${V0_CORNER_TR}
  <div style="position:absolute;left:0;top:0;width:4px;height:55%;background:linear-gradient(180deg,${GOLD} 0%,transparent 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:rgba(196,160,66,0.12);border:1px solid rgba(196,160,66,0.28);padding:6px 18px;border-radius:4px;margin-bottom:28px;align-self:flex-start;"><p style="font-size:11px;font-weight:900;color:${GOLD};letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h2 style="font-size:90px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:36px;max-width:900px;">${ag(s.title)}</h2>
      <div style="width:48px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:32px;"></div>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:800px;padding-left:24px;border-left:3px solid ${GOLD};">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v0_destaque(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, `background:#0C0A04;background-image:radial-gradient(rgba(196,160,66,0.05) 1px,transparent 1px);background-size:30px 30px;`, `
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:920px;height:920px;background:radial-gradient(circle,rgba(196,160,66,0.05) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:-10px;top:0;font-size:680px;font-weight:900;color:rgba(196,160,66,0.038);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <div style="position:absolute;top:0;left:0;width:160px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:160px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:160px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:160px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:48px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:48px;"></div>
      <h2 style="font-size:96px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.047em;margin-bottom:40px;max-width:900px;">${s.title}</h2>
      <p style="font-size:30px;font-weight:500;color:rgba(196,160,66,0.7);line-height:1.5;max-width:760px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v0_cta(s: SlideContent) {
  return slide(FONT_LINK, `background:#080808;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:30px 30px;`, `
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:960px;height:960px;background:radial-gradient(circle,rgba(196,160,66,0.055) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;left:-30px;bottom:60px;font-size:240px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.04em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <div style="position:absolute;top:0;left:0;width:160px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:160px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;right:0;width:160px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:160px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:160px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:160px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:160px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:160px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:88px;width:auto;object-fit:contain;margin-bottom:64px;" alt="UPFLU">
    <div style="width:48px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:56px;"></div>
    <h2 style="font-size:78px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.044em;margin-bottom:52px;max-width:860px;">${ag(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:18px 52px;margin-bottom:32px;">
      <p style="font-size:22px;font-weight:800;color:#080808;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.18);letter-spacing:0.16em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   VARIANT 1 — EDITORIAL WARM
   Warm dark · Thick gold strip · Pill badges · Bold
   ═══════════════════════════════════════════════════════ */

const V1_BG = `background:#100D02;`;
const V1_STRIP = `<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>`;

function v1_capa(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V1_BG, `
  ${V1_STRIP}
  <div style="position:absolute;top:-60px;right:-60px;width:420px;height:420px;background:${GOLD};transform:rotate(45deg);opacity:0.04;"></div>
  <div style="position:absolute;right:-20px;bottom:100px;font-size:320px;font-weight:900;color:rgba(196,160,66,0.038);line-height:1;letter-spacing:-0.05em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 110px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0 40px;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:7px 20px;border-radius:4px;margin-bottom:32px;align-self:flex-start;"><p style="font-size:11px;font-weight:900;color:#0D0D0D;letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h1 style="font-size:130px;font-weight:900;color:#FFFFFF;line-height:0.87;letter-spacing:-0.057em;margin-bottom:40px;max-width:930px;">${ag(s.title)}</h1>
      <div style="display:flex;align-items:center;gap:18px;">
        <div style="width:52px;height:3px;background:${GOLD};border-radius:2px;flex-shrink:0;"></div>
        ${s.subtitle ? `<p style="font-size:25px;font-weight:400;color:rgba(255,255,255,0.38);line-height:1.5;max-width:600px;">${s.subtitle}</p>` : ""}
      </div>
    </div>
    ${bottomBar()}
  </div>`);
}

function v1_numero(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V1_BG, `
  ${V1_STRIP}
  <div style="position:absolute;top:360px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(196,160,66,0.14),transparent);"></div>
  <div style="position:absolute;right:-140px;top:-140px;width:600px;height:600px;border:1px solid rgba(196,160,66,0.06);border-radius:50%;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 110px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="background:rgba(196,160,66,0.09);border:1px solid rgba(196,160,66,0.18);border-radius:14px;padding:24px 32px;margin-bottom:40px;align-self:flex-start;">
        <p style="font-size:220px;font-weight:900;color:${GOLD};line-height:0.82;letter-spacing:-0.07em;">${s.number || ""}</p>
      </div>
      <h2 style="font-size:64px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:28px;max-width:780px;">${ag(s.title)}</h2>
      <div style="display:flex;gap:18px;align-items:flex-start;">
        <div style="width:3px;background:${GOLD};border-radius:2px;flex-shrink:0;margin-top:5px;align-self:stretch;"></div>
        <p style="font-size:25px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.65;max-width:700px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>`);
}

function v1_texto(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V1_BG, `
  ${V1_STRIP}
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.018) 0px,rgba(196,160,66,0.018) 1px,transparent 1px,transparent 60px);"></div>
  <div style="position:absolute;right:60px;top:100px;font-size:280px;font-weight:900;color:rgba(196,160,66,0.048);line-height:1;letter-spacing:-0.06em;pointer-events:none;">${n}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 110px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:6px 18px;border-radius:4px;margin-bottom:28px;align-self:flex-start;"><p style="font-size:11px;font-weight:900;color:#0D0D0D;letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h2 style="font-size:90px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:40px;max-width:900px;">${ag(s.title)}</h2>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.44);line-height:1.65;max-width:800px;border-left:4px solid ${GOLD};padding-left:26px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v1_destaque(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V1_BG, `
  ${V1_STRIP}
  <div style="position:absolute;top:0;left:14px;right:0;height:10px;background:${GOLD};"></div>
  <div style="position:absolute;left:76px;top:130px;font-size:160px;font-weight:900;color:rgba(196,160,66,0.12);line-height:1;font-family:Georgia,serif;">"</div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(196,160,66,0.015) 0px,rgba(196,160,66,0.015) 1px,transparent 1px,transparent 80px);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:80px 80px 64px 110px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <h2 style="font-size:98px;font-weight:900;color:#FFFFFF;line-height:0.90;letter-spacing:-0.047em;margin-bottom:44px;max-width:900px;">${s.title}</h2>
      <div style="display:flex;align-items:center;gap:22px;">
        <div style="width:60px;height:3px;background:${GOLD};border-radius:2px;flex-shrink:0;"></div>
        <p style="font-size:28px;font-weight:500;color:rgba(196,160,66,0.68);line-height:1.5;max-width:720px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>`);
}

function v1_cta(s: SlideContent) {
  return slide(FONT_LINK, V1_BG, `
  ${V1_STRIP}
  <div style="position:absolute;top:0;left:14px;right:0;height:10px;background:${GOLD};"></div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.014) 0px,rgba(196,160,66,0.014) 1px,transparent 1px,transparent 60px);"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(196,160,66,0.042) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px 80px 80px 100px;text-align:center;">
    <img src="/upflu-logo.png" style="height:88px;width:auto;object-fit:contain;margin-bottom:56px;" alt="UPFLU">
    <h2 style="font-size:78px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.044em;margin-bottom:48px;max-width:840px;">${ag(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:18px 56px;margin-bottom:36px;">
      <p style="font-size:22px;font-weight:800;color:#0D0D0D;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.18);letter-spacing:0.14em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   VARIANT 2 — DEEP PURPLE
   Gradient background · Dramatic · Premium · No photos
   ═══════════════════════════════════════════════════════ */

const V2_BG = `background:radial-gradient(ellipse at 28% 42%, #220850 0%, #11051f 45%, #080810 100%);`;

function v2_capa(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V2_BG, `
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;right:-80px;top:160px;width:680px;height:680px;border:1px solid rgba(196,160,66,0.07);border-radius:50%;"></div>
  <div style="position:absolute;right:20px;top:280px;width:440px;height:440px;border:1px solid rgba(196,160,66,0.05);border-radius:50%;"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.06) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0 40px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.42em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:126px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.055em;margin-bottom:40px;max-width:880px;text-shadow:0 4px 60px rgba(120,40,160,0.5);">${ag_glow(s.title)}</h1>
      ${s.subtitle ? `<p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.5;max-width:620px;">${s.subtitle}</p>` : ""}
    </div>
    ${bottomBar()}
  </div>`);
}

function v2_numero(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V2_BG, `
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:-40px;bottom:60px;font-size:560px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.08em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.06) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:48px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:28px;box-shadow:0 0 20px rgba(196,160,66,0.4);"></div>
      <p style="font-size:240px;font-weight:900;color:${GOLD};line-height:0.80;letter-spacing:-0.07em;margin-bottom:28px;text-shadow:0 0 80px rgba(196,160,66,0.3);">${s.number || ""}</p>
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:32px;overflow:hidden;"><div style="width:68%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.18));border-radius:2px;"></div></div>
      <h2 style="font-size:62px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:22px;max-width:740px;">${ag(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.42);line-height:1.65;max-width:700px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v2_texto(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V2_BG, `
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.06) 100%);"></div>
  <div style="position:absolute;top:600px;left:96px;right:80px;height:1px;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.08));"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 96px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.42em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:92px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:40px;max-width:900px;">${ag_glow(s.title)}</h2>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.44);line-height:1.65;max-width:820px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v2_destaque(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, `background:radial-gradient(ellipse at 50% 50%, #1a0640 0%, #0a0320 50%, #060510 100%);`, `
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;right:-5px;top:10px;font-size:680px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <div style="position:absolute;top:0;left:0;width:160px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:160px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:160px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:160px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:48px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:48px;box-shadow:0 0 20px rgba(196,160,66,0.4);"></div>
      <h2 style="font-size:96px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.047em;margin-bottom:44px;max-width:900px;">${s.title}</h2>
      <p style="font-size:30px;font-weight:500;color:rgba(196,160,66,0.72);line-height:1.5;max-width:760px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

function v2_cta(s: SlideContent) {
  return slide(FONT_LINK, `background:radial-gradient(ellipse at 50% 45%, #220850 0%, #10041e 50%, #080810 100%);`, `
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.038) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:840px;height:840px;border:1px solid rgba(196,160,66,0.07);border-radius:50%;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:560px;height:560px;border:1px solid rgba(196,160,66,0.05);border-radius:50%;"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:88px;width:auto;object-fit:contain;margin-bottom:56px;" alt="UPFLU">
    <div style="width:48px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:52px;box-shadow:0 0 20px rgba(196,160,66,0.5);"></div>
    <h2 style="font-size:78px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.044em;margin-bottom:52px;max-width:840px;text-shadow:0 4px 60px rgba(120,40,160,0.5);">${ag_glow(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:18px 52px;margin-bottom:32px;box-shadow:0 0 40px rgba(196,160,66,0.3);">
      <p style="font-size:22px;font-weight:800;color:#080808;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.18);letter-spacing:0.14em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   VARIANT 3 — CYBER TEAL (HUD)
   Deep navy gradient · Cyan accents · Grid · Centered
   ═══════════════════════════════════════════════════════ */

const V3_BG = `background:linear-gradient(155deg, #021824 0%, #040d16 50%, #040406 100%);`;

function v3_capa(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V3_BG, `
  ${hudFrame()}
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(0,207,255,0.04) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${cyanTopBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:32px;"><div style="width:18px;height:1px;background:${CYAN};box-shadow:0 0 6px ${CYAN};"></div><p style="font-size:11px;font-weight:800;color:${CYAN};letter-spacing:0.44em;text-transform:uppercase;text-shadow:0 0 12px rgba(0,207,255,0.55);">${s.eyebrow}</p><div style="width:18px;height:1px;background:${CYAN};box-shadow:0 0 6px ${CYAN};"></div></div>` : ""}
      <h1 style="font-size:124px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.055em;margin-bottom:36px;max-width:940px;text-shadow:0 4px 80px rgba(0,0,0,0.9);text-align:center;">${ac(s.title)}</h1>
      ${s.subtitle ? `<div style="width:44px;height:2px;background:${CYAN};border-radius:1px;margin:0 auto 22px;box-shadow:0 0 10px ${CYAN};"></div><p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.52);line-height:1.55;max-width:620px;text-align:center;">${s.subtitle}</p>` : ""}
    </div>
    ${cyanBottomBar()}
  </div>`);
}

function v3_numero(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V3_BG, `
  ${hudFrame()}
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:540px;font-weight:900;color:rgba(0,207,255,0.035);line-height:1;letter-spacing:-0.08em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${cyanTopBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      <p style="font-size:216px;font-weight:900;color:${CYAN};line-height:0.82;letter-spacing:-0.07em;margin-bottom:24px;text-shadow:0 0 60px rgba(0,207,255,0.45),0 0 120px rgba(0,207,255,0.18);">${s.number || ""}</p>
      <div style="width:72px;height:2px;background:${CYAN};border-radius:1px;margin:0 auto 28px;box-shadow:0 0 10px ${CYAN};"></div>
      <h2 style="font-size:58px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.033em;margin-bottom:24px;max-width:800px;text-align:center;">${ac(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.44);line-height:1.65;max-width:680px;text-align:center;">${s.body || ""}</p>
    </div>
    ${cyanBottomBar()}
  </div>`);
}

function v3_texto(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V3_BG, `
  ${hudFrame()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${cyanTopBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:28px;"><div style="width:18px;height:1px;background:${CYAN};box-shadow:0 0 6px ${CYAN};"></div><p style="font-size:11px;font-weight:800;color:${CYAN};letter-spacing:0.44em;text-transform:uppercase;">${s.eyebrow}</p><div style="width:18px;height:1px;background:${CYAN};box-shadow:0 0 6px ${CYAN};"></div></div>` : ""}
      <h2 style="font-size:88px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:40px;max-width:900px;text-align:center;">${ac(s.title)}</h2>
      <div style="width:44px;height:2px;background:${CYAN};border-radius:1px;margin:0 auto 32px;box-shadow:0 0 10px ${CYAN};"></div>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:760px;text-align:center;">${s.body || ""}</p>
    </div>
    ${cyanBottomBar()}
  </div>`);
}

function v3_destaque(s: SlideContent, n: number, total: number) {
  return slide(FONT_LINK, V3_BG, `
  ${hudFrame()}
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:380px;font-weight:900;color:rgba(0,207,255,0.04);line-height:1;font-family:Georgia,serif;pointer-events:none;white-space:nowrap;">"</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${cyanTopBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      <div style="width:1px;height:56px;background:linear-gradient(180deg,transparent,${CYAN});margin:0 auto 36px;box-shadow:0 0 10px rgba(0,207,255,0.4);"></div>
      <h2 style="font-size:90px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.046em;margin-bottom:40px;max-width:920px;text-align:center;">${s.title}</h2>
      <div style="width:1px;height:56px;background:linear-gradient(180deg,${CYAN},transparent);margin:0 auto 32px;box-shadow:0 0 10px rgba(0,207,255,0.4);"></div>
      <p style="font-size:28px;font-weight:500;color:rgba(0,207,255,0.7);line-height:1.5;max-width:740px;text-align:center;">${s.body || ""}</p>
    </div>
    ${cyanBottomBar()}
  </div>`);
}

function v3_cta(s: SlideContent) {
  return slide(FONT_LINK, V3_BG, `
  ${hudFrame()}
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;border:1px solid rgba(0,207,255,0.07);border-radius:50%;pointer-events:none;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:480px;height:480px;border:1px solid rgba(0,207,255,0.05);border-radius:50%;pointer-events:none;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:84px;width:auto;object-fit:contain;margin-bottom:52px;filter:drop-shadow(0 0 16px rgba(0,207,255,0.35));" alt="UPFLU">
    <div style="width:44px;height:2px;background:${CYAN};border-radius:1px;margin:0 auto 44px;box-shadow:0 0 12px ${CYAN};"></div>
    <h2 style="font-size:76px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.044em;margin-bottom:48px;max-width:840px;">${ac(s.title)}</h2>
    <div style="background:${CYAN};border-radius:100px;padding:18px 52px;margin-bottom:28px;box-shadow:0 0 40px rgba(0,207,255,0.28);">
      <p style="font-size:22px;font-weight:800;color:#020e18;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:13px;font-weight:600;color:rgba(0,207,255,0.3);letter-spacing:0.3em;text-transform:uppercase;">IA PARA PEQUENOS NEGÓCIOS</p>
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   Public API
   variant 0 = Dark Precision  (gold, black)
   variant 1 = Editorial Warm  (gold, warm dark)
   variant 2 = Deep Purple     (gold, purple gradient)
   variant 3 = Cyber Teal HUD  (cyan, navy gradient)
   ═══════════════════════════════════════════════════════ */

export function renderSlide(s: SlideContent, n: number, total: number, variant = 0): string {
  const v = variant % 4;
  switch (s.type) {
    case "capa":
      return v === 0 ? v0_capa(s, n, total)
           : v === 1 ? v1_capa(s, n, total)
           : v === 2 ? v2_capa(s, n, total)
           : v3_capa(s, n, total);
    case "numero":
      return v === 0 ? v0_numero(s, n, total)
           : v === 1 ? v1_numero(s, n, total)
           : v === 2 ? v2_numero(s, n, total)
           : v3_numero(s, n, total);
    case "texto":
      return v === 0 ? v0_texto(s, n, total)
           : v === 1 ? v1_texto(s, n, total)
           : v === 2 ? v2_texto(s, n, total)
           : v3_texto(s, n, total);
    case "destaque":
      return v === 0 ? v0_destaque(s, n, total)
           : v === 1 ? v1_destaque(s, n, total)
           : v === 2 ? v2_destaque(s, n, total)
           : v3_destaque(s, n, total);
    case "cta":
    default:
      return v === 0 ? v0_cta(s)
           : v === 1 ? v1_cta(s)
           : v === 2 ? v2_cta(s)
           : v3_cta(s);
  }
}
