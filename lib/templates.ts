// ═══════════════════════════════════════════════════════
//  UPFLU Carousel Templates — Identidade visual oficial
//  Fundo #080808 · Teal #0A7E8C · Texto #F5F2EC
//  Clash Display (títulos) + Outfit (corpo)
// ═══════════════════════════════════════════════════════

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet">
`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

const TEAL   = "#0A7E8C";
const TEAL_D = "rgba(10,126,140,0.12)";
const BG1    = "#080808";
const BG2    = "#0D0D0D";
const TEXT   = "#F5F2EC";
const MUTED  = "rgba(245,242,236,0.48)";
const BORDER = "rgba(255,255,255,0.06)";

export interface SlideContent {
  type: "capa" | "numero" | "texto" | "destaque" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  number?: string;
  handle?: string;
}

function hl(t: string): string {
  return (t || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${TEAL}">$1</span>`);
}
function pad(n: number): string { return String(n).padStart(2, "0"); }

// ─── Shared top bar ──────────────────────────────────────────────────────────

function topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:36px;width:auto;object-fit:contain;" alt="UPFLU">
    <span style="font-size:13px;font-weight:600;color:rgba(245,242,236,0.2);letter-spacing:0.18em;font-family:'Outfit',sans-serif;">${pad(n)} / ${pad(total)}</span>
  </div>`;
}

// ─── Shared bottom bar ────────────────────────────────────────────────────────

function bottomBar(handle = "@upfluagencia") {
  return `<div style="display:flex;align-items:center;gap:14px;padding-top:20px;border-top:1px solid ${BORDER};position:relative;z-index:2;">
    <div style="width:28px;height:2px;background:${TEAL};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:500;color:rgba(245,242,236,0.28);letter-spacing:0.07em;font-family:'Outfit',sans-serif;">${handle}</span>
  </div>`;
}

// ─── Subtle background texture ───────────────────────────────────────────────

function bgTexture(glowPos = "80% 15%") {
  return `
  <div style="position:absolute;inset:0;background-image:linear-gradient(${BORDER} 1px,transparent 1px),linear-gradient(90deg,${BORDER} 1px,transparent 1px);background-size:48px 48px;opacity:0.5;"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at ${glowPos},rgba(10,126,140,0.07) 0%,transparent 55%);"></div>`;
}

function wrap(bg: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}body{font-family:'Outfit',sans-serif;}</style></head><body>
<div style="width:1080px;height:1350px;background:${bg};position:relative;overflow:hidden;">${content}</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   CAPA — Hero de abertura
   ═══════════════════════════════════════════════════════ */

function slide_capa(s: SlideContent, n: number, total: number) {
  return wrap(BG1, `
  ${bgTexture("82% 18%")}
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,${TEAL} 0%,transparent 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0 40px;">
      ${s.eyebrow ? `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:36px;">
          <div style="width:32px;height:2px;background:${TEAL};border-radius:1px;flex-shrink:0;"></div>
          <p style="font-size:12px;font-weight:700;color:${TEAL};letter-spacing:0.38em;text-transform:uppercase;font-family:'Outfit',sans-serif;">${s.eyebrow}</p>
        </div>` : ""}
      <h1 style="font-size:116px;font-weight:700;color:${TEXT};line-height:0.92;letter-spacing:-0.04em;margin-bottom:40px;max-width:900px;font-family:'Clash Display',sans-serif;">${hl(s.title)}</h1>
      ${s.subtitle ? `
        <div style="display:flex;align-items:flex-start;gap:20px;">
          <div style="width:3px;align-self:stretch;flex-shrink:0;background:${TEAL};border-radius:1px;margin-top:4px;"></div>
          <p style="font-size:25px;font-weight:400;color:${MUTED};line-height:1.55;max-width:640px;font-family:'Outfit',sans-serif;">${s.subtitle}</p>
        </div>` : ""}
    </div>
    ${bottomBar()}
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   NÚMERO — Dado de impacto
   ═══════════════════════════════════════════════════════ */

function slide_numero(s: SlideContent, n: number, total: number) {
  return wrap(BG2, `
  ${bgTexture("20% 60%")}
  <div style="position:absolute;right:-20px;bottom:40px;font-size:560px;font-weight:700;color:rgba(10,126,140,0.04);line-height:1;letter-spacing:-0.08em;pointer-events:none;white-space:nowrap;font-family:'Clash Display',sans-serif;">${s.number || ""}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:48px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:28px;"></div>
      <p style="font-size:240px;font-weight:700;color:${TEAL};line-height:0.82;letter-spacing:-0.07em;margin-bottom:28px;font-family:'Clash Display',sans-serif;">${s.number || ""}</p>
      <div style="width:100%;height:1px;background:${BORDER};margin-bottom:32px;"></div>
      <h2 style="font-size:64px;font-weight:700;color:${TEXT};line-height:0.97;letter-spacing:-0.035em;margin-bottom:22px;max-width:760px;font-family:'Clash Display',sans-serif;">${hl(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:${MUTED};line-height:1.6;max-width:720px;font-family:'Outfit',sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   TEXTO — Conteúdo / dica
   ═══════════════════════════════════════════════════════ */

function slide_texto(s: SlideContent, n: number, total: number) {
  return wrap(BG2, `
  ${bgTexture("75% 80%")}
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,transparent 0%,${TEAL} 40%,transparent 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `
        <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:28px;align-self:flex-start;">
          <div style="background:${TEAL_D};border:1px solid rgba(10,126,140,0.3);padding:6px 16px;border-radius:2px;">
            <p style="font-size:11px;font-weight:700;color:${TEAL};letter-spacing:0.36em;text-transform:uppercase;font-family:'Outfit',sans-serif;">${s.eyebrow}</p>
          </div>
        </div>` : ""}
      <h2 style="font-size:90px;font-weight:700;color:${TEXT};line-height:0.92;letter-spacing:-0.04em;margin-bottom:36px;max-width:900px;font-family:'Clash Display',sans-serif;">${hl(s.title)}</h2>
      <div style="width:48px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:32px;"></div>
      <p style="font-size:26px;font-weight:400;color:${MUTED};line-height:1.65;max-width:820px;padding-left:24px;border-left:3px solid ${TEAL};font-family:'Outfit',sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   DESTAQUE — Frase de impacto
   ═══════════════════════════════════════════════════════ */

function slide_destaque(s: SlideContent, n: number, total: number) {
  return wrap(BG1, `
  ${bgTexture("50% 50%")}
  <div style="position:absolute;top:0;left:80px;right:80px;height:2px;background:linear-gradient(90deg,transparent,${TEAL},transparent);"></div>
  <div style="position:absolute;bottom:0;left:80px;right:80px;height:2px;background:linear-gradient(90deg,transparent,${TEAL},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:3px;height:60px;background:${TEAL};margin-bottom:44px;border-radius:1px;"></div>
      <h2 style="font-size:96px;font-weight:700;color:${TEXT};line-height:0.91;letter-spacing:-0.045em;margin-bottom:44px;max-width:900px;font-family:'Clash Display',sans-serif;">${s.title}</h2>
      <p style="font-size:28px;font-weight:400;color:${TEAL};line-height:1.5;max-width:760px;font-family:'Outfit',sans-serif;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   CTA — Chamada final
   ═══════════════════════════════════════════════════════ */

function slide_cta(s: SlideContent) {
  return wrap(BG1, `
  ${bgTexture("50% 50%")}
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${TEAL},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${TEAL},transparent);"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:800px;height:800px;border:1px solid rgba(10,126,140,0.07);border-radius:50%;pointer-events:none;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:560px;height:560px;border:1px solid rgba(10,126,140,0.05);border-radius:50%;pointer-events:none;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:52px;width:auto;object-fit:contain;margin-bottom:52px;" alt="UPFLU">
    <div style="width:48px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:52px;"></div>
    <h2 style="font-size:82px;font-weight:700;color:${TEXT};line-height:0.93;letter-spacing:-0.044em;margin-bottom:52px;max-width:860px;font-family:'Clash Display',sans-serif;">${hl(s.title)}</h2>
    <div style="background:${TEAL};border-radius:2px;padding:20px 56px;margin-bottom:32px;">
      <p style="font-size:20px;font-weight:600;color:#080808;letter-spacing:0.08em;font-family:'Outfit',sans-serif;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:13px;font-weight:400;color:rgba(245,242,236,0.2);letter-spacing:0.2em;text-transform:uppercase;font-family:'Outfit',sans-serif;">IA para pequenos negócios</p>
  </div>`);
}

/* ═══════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════ */

export function renderSlide(s: SlideContent, n: number, total: number): string {
  switch (s.type) {
    case "capa":     return slide_capa(s, n, total);
    case "numero":   return slide_numero(s, n, total);
    case "texto":    return slide_texto(s, n, total);
    case "destaque": return slide_destaque(s, n, total);
    case "cta":
    default:         return slide_cta(s);
  }
}
