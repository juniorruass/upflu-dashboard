// ═══════════════════════════════════════════════════════
//  UPFLU Carousel Templates
//  #080808 · Teal #0A7E8C · #F5F2EC
//  Space Grotesk (títulos) + Outfit (corpo)
//  Ambos Google Fonts — carregam 100% no download
// ═══════════════════════════════════════════════════════

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
const BASE  = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

const TEAL    = "#0A7E8C";
const TEAL_BG = "rgba(10,126,140,0.1)";
const TEAL_BD = "rgba(10,126,140,0.28)";
const BG1     = "#080808";
const BG2     = "#0C0C0C";
const TEXT     = "#F5F2EC";
const MUTED    = "rgba(245,242,236,0.50)";
const MUTED2   = "rgba(245,242,236,0.28)";
const BORDER   = "rgba(255,255,255,0.06)";
const HEAD     = "'Space Grotesk',system-ui,sans-serif";
const BODY     = "'Outfit',system-ui,sans-serif";

export interface SlideContent {
  type: "capa" | "numero" | "texto" | "lista" | "stats" | "destaque" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  number?: string;
  handle?: string;
  // lista: body separado por "|"
  // stats: body no formato "número§label|número§label|..."
}

export interface SlidePhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

function hl(t: string): string {
  return (t || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${TEAL}">$1</span>`);
}
function pad(n: number) { return String(n).padStart(2, "0"); }

function topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;z-index:2;position:relative;">
    <img src="/upflu-logo.png" style="height:34px;width:auto;object-fit:contain;" alt="UPFLU">
    <span style="font-size:13px;font-weight:600;color:${MUTED2};letter-spacing:0.18em;font-family:${BODY};">${pad(n)} / ${pad(total)}</span>
  </div>`;
}

function bottomBar(handle = "@upfluagencia") {
  return `<div style="display:flex;align-items:center;gap:14px;padding-top:20px;border-top:1px solid ${BORDER};z-index:2;position:relative;">
    <div style="width:28px;height:2px;background:${TEAL};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:500;color:${MUTED2};letter-spacing:0.07em;font-family:${BODY};">${handle}</span>
  </div>`;
}

function glow(pos = "78% 18%") {
  return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at ${pos},rgba(10,126,140,0.07) 0%,transparent 55%);pointer-events:none;"></div>`;
}
function grid() {
  return `<div style="position:absolute;inset:0;background-image:linear-gradient(${BORDER} 1px,transparent 1px),linear-gradient(90deg,${BORDER} 1px,transparent 1px);background-size:48px 48px;opacity:0.55;pointer-events:none;"></div>`;
}

function wrap(bg: string, content: string, photo?: string, coverPhoto = false): string {
  const photoLayers = photo ? `
    <div style="position:absolute;inset:0;background-image:url('${photo}');background-size:cover;background-position:center ${coverPhoto ? "top" : "center"};z-index:0;"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,9,13,0.48) 0%,rgba(5,9,13,0.68) 45%,rgba(5,9,13,0.88) 75%,rgba(5,9,13,0.97) 100%);z-index:1;"></div>` : `${grid()}${glow()}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${FONTS}<style>${BASE}body{font-family:${BODY};}</style></head><body>
<div style="width:1080px;height:1350px;background:${bg};position:relative;overflow:hidden;">${photoLayers}${content}</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   CAPA
   ═══════════════════════════════════════════════════════ */
function slide_capa(s: SlideContent, n: number, total: number, photo?: string) {
  return wrap(BG1, `
  ${grid()}${glow("82% 15%")}
  <div style="position:absolute;left:0;top:0;height:100%;width:4px;background:linear-gradient(180deg,${TEAL} 0%,transparent 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
        <div style="width:28px;height:2px;background:${TEAL};border-radius:1px;"></div>
        <span style="font-size:12px;font-weight:700;color:${TEAL};letter-spacing:0.38em;text-transform:uppercase;font-family:${BODY};">${s.eyebrow}</span>
      </div>` : ""}
      <h1 style="font-size:112px;font-weight:700;color:${TEXT};line-height:0.92;letter-spacing:-0.04em;margin-bottom:36px;max-width:900px;font-family:${HEAD};">${hl(s.title)}</h1>
      ${s.subtitle ? `<div style="display:flex;gap:18px;align-items:flex-start;">
        <div style="width:3px;flex-shrink:0;align-self:stretch;background:${TEAL};border-radius:1px;margin-top:4px;"></div>
        <p style="font-size:24px;font-weight:400;color:${MUTED};line-height:1.55;max-width:660px;font-family:${BODY};">${s.subtitle}</p>
      </div>` : ""}
    </div>
    ${bottomBar()}
  </div>`, photo, true);
}

/* ═══════════════════════════════════════════════════════
   NÚMERO — dado de impacto
   ═══════════════════════════════════════════════════════ */
function slide_numero(s: SlideContent, n: number, total: number, photo?: string) {
  return wrap(BG2, `
  ${grid()}${glow("20% 65%")}
  <div style="position:absolute;right:-10px;bottom:30px;font-size:520px;font-weight:700;color:rgba(10,126,140,0.04);line-height:1;letter-spacing:-0.07em;pointer-events:none;font-family:${HEAD};">${s.number||""}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:44px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:24px;"></div>
      <p style="font-size:228px;font-weight:700;color:${TEAL};line-height:0.82;letter-spacing:-0.065em;margin-bottom:24px;font-family:${HEAD};">${s.number||""}</p>
      <div style="width:100%;height:1px;background:${BORDER};margin-bottom:28px;"></div>
      <h2 style="font-size:62px;font-weight:700;color:${TEXT};line-height:0.97;letter-spacing:-0.032em;margin-bottom:20px;max-width:760px;font-family:${HEAD};">${hl(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:${MUTED};line-height:1.6;max-width:720px;font-family:${BODY};">${s.body||""}</p>
    </div>
    ${bottomBar()}
  </div>`, photo);
}

/* ═══════════════════════════════════════════════════════
   TEXTO — insight / dica
   ═══════════════════════════════════════════════════════ */
function slide_texto(s: SlideContent, n: number, total: number, photo?: string) {
  return wrap(BG2, `
  <div style="position:absolute;left:0;top:0;height:100%;width:4px;background:linear-gradient(180deg,transparent 0%,${TEAL} 40%,transparent 100%);z-index:3;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="background:${TEAL_BG};border:1px solid ${TEAL_BD};padding:7px 18px;border-radius:2px;align-self:flex-start;margin-bottom:28px;">
        <span style="font-size:11px;font-weight:700;color:${TEAL};letter-spacing:0.38em;text-transform:uppercase;font-family:${BODY};">${s.eyebrow}</span>
      </div>` : ""}
      <h2 style="font-size:88px;font-weight:700;color:${TEXT};line-height:0.92;letter-spacing:-0.038em;margin-bottom:32px;max-width:900px;font-family:${HEAD};">${hl(s.title)}</h2>
      <div style="width:44px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:28px;"></div>
      <p style="font-size:25px;font-weight:400;color:${MUTED};line-height:1.65;max-width:820px;padding-left:24px;border-left:3px solid ${TEAL};font-family:${BODY};">${s.body||""}</p>
    </div>
    ${bottomBar()}
  </div>`, photo);
}

/* ═══════════════════════════════════════════════════════
   LISTA — checklist de pontos
   body: itens separados por "|"
   ═══════════════════════════════════════════════════════ */
function slide_lista(s: SlideContent, n: number, total: number, photo?: string) {
  const items = (s.body || "").split("|").map(i => i.trim()).filter(Boolean);
  const listHtml = items.map((item, i) => `
    <div style="display:flex;align-items:flex-start;gap:18px;padding:16px 20px;background:rgba(5,9,13,0.5);border-radius:2px;border-left:3px solid ${i % 2 === 0 ? TEAL : "rgba(10,126,140,0.3)"};">
      <div style="width:22px;height:22px;background:${TEAL_BG};border:1px solid ${TEAL_BD};border-radius:2px;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:3px;">
        <div style="width:7px;height:7px;background:${TEAL};border-radius:1px;"></div>
      </div>
      <span style="font-size:21px;font-weight:400;color:${TEXT};line-height:1.45;font-family:${BODY};">${item}</span>
    </div>`).join("");

  return wrap(BG1, `
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:28px 0;">
      ${s.eyebrow ? `<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <div style="width:28px;height:2px;background:${TEAL};border-radius:1px;"></div>
        <span style="font-size:12px;font-weight:700;color:${TEAL};letter-spacing:0.38em;text-transform:uppercase;font-family:${BODY};">${s.eyebrow}</span>
      </div>` : ""}
      <h2 style="font-size:70px;font-weight:700;color:${TEXT};line-height:0.94;letter-spacing:-0.035em;margin-bottom:32px;max-width:900px;font-family:${HEAD};">${hl(s.title)}</h2>
      <div style="display:flex;flex-direction:column;gap:8px;">${listHtml}</div>
    </div>
    ${bottomBar()}
  </div>`, photo);
}

/* ═══════════════════════════════════════════════════════
   STATS — grade de métricas
   body: "número§label|número§label|..."
   ═══════════════════════════════════════════════════════ */
function slide_stats(s: SlideContent, n: number, total: number, photo?: string) {
  const stats = (s.body || "").split("|").map(item => {
    const [num, ...rest] = item.split("§");
    return { num: (num || "").trim(), label: rest.join("§").trim() };
  }).filter(st => st.num);

  const cardHtml = stats.map(st => `
    <div style="background:rgba(5,9,13,0.6);border:1px solid rgba(10,126,140,0.2);border-radius:2px;padding:24px 20px;display:flex;flex-direction:column;gap:8px;border-top:2px solid ${TEAL};">
      <p style="font-size:58px;font-weight:700;color:${TEAL};line-height:1;letter-spacing:-0.04em;font-family:${HEAD};">${st.num}</p>
      <p style="font-size:15px;font-weight:400;color:${MUTED};line-height:1.4;font-family:${BODY};">${st.label}</p>
    </div>`).join("");

  const cols = stats.length <= 2 ? "1fr 1fr" : stats.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr";

  return wrap(BG2, `
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px 0;">
      ${s.eyebrow ? `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:28px;height:2px;background:${TEAL};border-radius:1px;"></div>
        <span style="font-size:12px;font-weight:700;color:${TEAL};letter-spacing:0.38em;text-transform:uppercase;font-family:${BODY};">${s.eyebrow}</span>
      </div>` : ""}
      <h2 style="font-size:72px;font-weight:700;color:${TEXT};line-height:0.93;letter-spacing:-0.036em;margin-bottom:36px;max-width:900px;font-family:${HEAD};">${hl(s.title)}</h2>
      <div style="display:grid;grid-template-columns:${cols};gap:12px;">${cardHtml}</div>
      ${s.subtitle ? `<div style="margin-top:24px;padding:16px 20px;background:rgba(5,9,13,0.6);border:1px solid ${TEAL_BD};border-radius:2px;">
        <p style="font-size:19px;font-weight:500;color:${TEXT};line-height:1.5;font-family:${BODY};">${s.subtitle}</p>
      </div>` : ""}
    </div>
    ${bottomBar()}
  </div>`, photo);
}

/* ═══════════════════════════════════════════════════════
   DESTAQUE — frase de impacto
   ═══════════════════════════════════════════════════════ */
function slide_destaque(s: SlideContent, n: number, total: number, photo?: string) {
  return wrap(BG1, `
  <div style="position:absolute;top:0;left:80px;right:80px;height:2px;background:linear-gradient(90deg,transparent,${TEAL},transparent);z-index:3;"></div>
  <div style="position:absolute;bottom:0;left:80px;right:80px;height:2px;background:linear-gradient(90deg,transparent,${TEAL},transparent);z-index:3;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:3px;height:56px;background:${TEAL};margin-bottom:40px;border-radius:1px;"></div>
      <h2 style="font-size:94px;font-weight:700;color:${TEXT};line-height:0.91;letter-spacing:-0.042em;margin-bottom:40px;max-width:900px;font-family:${HEAD};">${s.title}</h2>
      <p style="font-size:26px;font-weight:400;color:${TEAL};line-height:1.5;max-width:760px;font-family:${BODY};">${s.body||""}</p>
    </div>
    ${bottomBar()}
  </div>`, photo);
}

/* ═══════════════════════════════════════════════════════
   CTA — chamada final
   ═══════════════════════════════════════════════════════ */
function slide_cta(s: SlideContent, photo?: string) {
  return wrap(BG1, `
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${TEAL},transparent);z-index:3;"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${TEAL},transparent);z-index:3;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:780px;height:780px;border:1px solid rgba(10,126,140,0.07);border-radius:50%;pointer-events:none;z-index:2;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:540px;height:540px;border:1px solid rgba(10,126,140,0.05);border-radius:50%;pointer-events:none;z-index:2;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:48px;width:auto;object-fit:contain;margin-bottom:48px;" alt="UPFLU">
    <div style="width:44px;height:3px;background:${TEAL};border-radius:1px;margin-bottom:48px;"></div>
    <h2 style="font-size:80px;font-weight:700;color:${TEXT};line-height:0.93;letter-spacing:-0.04em;margin-bottom:48px;max-width:860px;font-family:${HEAD};">${hl(s.title)}</h2>
    <div style="background:${TEAL};border-radius:2px;padding:20px 56px;margin-bottom:28px;">
      <p style="font-size:20px;font-weight:600;color:#080808;letter-spacing:0.08em;font-family:${BODY};">${s.handle||"@upfluagencia"}</p>
    </div>
    <p style="font-size:13px;font-weight:400;color:${MUTED2};letter-spacing:0.2em;text-transform:uppercase;font-family:${BODY};">IA para pequenos negócios</p>
  </div>`, photo, true);
}

/* ═══════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════ */
export function renderSlide(s: SlideContent, n: number, total: number, photos?: SlidePhotos): string {
  const cover   = photos?.cover   || "";
  const content = photos?.content || "";
  switch (s.type) {
    case "capa":     return slide_capa(s, n, total, cover);
    case "numero":   return slide_numero(s, n, total, content);
    case "texto":    return slide_texto(s, n, total, content);
    case "lista":    return slide_lista(s, n, total, content);
    case "stats":    return slide_stats(s, n, total, content);
    case "destaque": return slide_destaque(s, n, total, content);
    case "cta":
    default:         return slide_cta(s, cover);
  }
}
