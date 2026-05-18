import { pickPhoto } from "@/lib/photos";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;
const GOLD = "#C4A042";

function accent(text: string): string {
  return (text || "").replace(/\{\{(.*?)\}\}/g, `<span style="color:${GOLD};">$1</span>`);
}

function topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:48px;width:auto;object-fit:contain;" alt="UPFLU" />
    <span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.25);letter-spacing:0.18em;font-family:Inter,sans-serif;">${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
  </div>`;
}

function bottomBar(handle = "@upfluagencia") {
  return `<div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:22px;display:flex;align-items:center;gap:12px;position:relative;z-index:2;">
    <div style="width:28px;height:2px;background:${GOLD};border-radius:1px;flex-shrink:0;"></div>
    <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.08em;font-family:Inter,sans-serif;">${handle}</span>
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

/* ═══════════════════════════════════════════════════════
   VARIANT 0 — DARK TECH
   Dot grid · Gold orbs · Bar charts · Corner accents
   ═══════════════════════════════════════════════════════ */

function v0_capa(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.14);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;right:-120px;top:220px;width:900px;height:900px;background:radial-gradient(circle,rgba(196,160,66,0.09) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:50px;top:320px;width:520px;height:520px;border:1px solid rgba(196,160,66,0.08);border-radius:50%;"></div>
  <div style="position:absolute;right:160px;top:430px;width:300px;height:300px;border:1px solid rgba(196,160,66,0.05);border-radius:50%;"></div>
  <div style="position:absolute;top:0;right:0;width:150px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:150px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:150px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:150px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:64px 0 48px;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:32px;">${s.eyebrow}</p>` : ""}
      <h1 style="font-size:120px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.055em;margin-bottom:44px;max-width:840px;">${accent(s.title)}</h1>
      ${s.subtitle ? `<div style="display:flex;align-items:flex-start;gap:20px;"><div style="width:3px;flex-shrink:0;margin-top:6px;align-self:stretch;background:${GOLD};border-radius:2px;"></div><p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.5;max-width:600px;">${s.subtitle}</p></div>` : ""}
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v0_numero(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.14);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:-60px;bottom:60px;font-size:600px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.08em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:absolute;right:60px;bottom:100px;display:flex;align-items:flex-end;gap:14px;z-index:1;pointer-events:none;">
    <div style="width:44px;height:150px;background:rgba(196,160,66,0.06);border-radius:5px 5px 0 0;"></div>
    <div style="width:44px;height:240px;background:rgba(196,160,66,0.10);border-radius:5px 5px 0 0;"></div>
    <div style="width:44px;height:180px;background:rgba(196,160,66,0.07);border-radius:5px 5px 0 0;"></div>
    <div style="width:44px;height:340px;background:rgba(196,160,66,0.14);border-radius:5px 5px 0 0;"></div>
    <div style="width:44px;height:280px;background:rgba(196,160,66,0.10);border-radius:5px 5px 0 0;"></div>
  </div>
  <div style="position:absolute;top:0;right:0;width:150px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:150px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:56px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:36px;"></div>
      <p style="font-size:240px;font-weight:900;color:${GOLD};line-height:0.80;letter-spacing:-0.07em;margin-bottom:36px;">${s.number || ""}</p>
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.05);border-radius:2px;margin-bottom:36px;overflow:hidden;"><div style="width:72%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.25));border-radius:2px;"></div></div>
      <h2 style="font-size:60px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:28px;max-width:740px;">${accent(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:700px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v0_texto(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.14);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:0;top:0;width:5px;height:60%;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0) 100%);"></div>
  <svg style="position:absolute;right:0;bottom:60px;z-index:1;pointer-events:none;" width="520" height="340" viewBox="0 0 520 340" fill="none">
    <polyline points="40,300 140,235 240,185 340,115 460,50" stroke="rgba(196,160,66,0.12)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="460" cy="50" r="8" fill="rgba(196,160,66,0.2)"/>
    <circle cx="340" cy="115" r="5" fill="rgba(196,160,66,0.12)"/>
    <circle cx="240" cy="185" r="5" fill="rgba(196,160,66,0.10)"/>
  </svg>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:92px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:40px;max-width:880px;">${accent(s.title)}</h2>
      <div style="width:56px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:36px;"></div>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:800px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v0_destaque(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0C0A04;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.2);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(196,160,66,0.05) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1000px;height:1000px;background:radial-gradient(circle,rgba(196,160,66,0.055) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;right:-10px;top:10px;font-size:720px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <div style="position:absolute;top:0;left:0;width:150px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:150px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:150px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:150px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:56px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:52px;"></div>
      <h2 style="font-size:96px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.047em;margin-bottom:44px;max-width:880px;">${s.title}</h2>
      <p style="font-size:30px;font-weight:500;color:rgba(196,160,66,0.72);line-height:1.5;max-width:740px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   VARIANT 1 — EDITORIAL BOLD
   Warm dark bg · Gold left strip · Diagonal texture · Pill tags
   ═══════════════════════════════════════════════════════ */

function v1_capa(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;top:-80px;right:-80px;width:500px;height:500px;background:${GOLD};transform:rotate(45deg);opacity:0.06;"></div>
  <div style="position:absolute;top:-40px;right:-40px;width:320px;height:320px;background:${GOLD};transform:rotate(45deg);opacity:0.05;"></div>
  <div style="position:absolute;right:-20px;bottom:80px;font-size:340px;font-weight:900;color:rgba(196,160,66,0.045);line-height:1;letter-spacing:-0.05em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.08) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:7px 20px;border-radius:4px;margin-bottom:36px;align-self:flex-start;"><p style="font-size:12px;font-weight:900;color:#0D0D0D;letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h1 style="font-size:136px;font-weight:900;color:#FFFFFF;line-height:0.86;letter-spacing:-0.06em;margin-bottom:44px;max-width:920px;">${accent(s.title)}</h1>
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="width:56px;height:3px;background:${GOLD};border-radius:2px;flex-shrink:0;"></div>
        ${s.subtitle ? `<p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.4);line-height:1.5;max-width:580px;">${s.subtitle}</p>` : ""}
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v1_numero(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;top:380px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(196,160,66,0.18),transparent);"></div>
  <div style="position:absolute;right:-180px;top:-180px;width:680px;height:680px;border:1px solid rgba(196,160,66,0.07);border-radius:50%;"></div>
  <div style="position:absolute;right:-90px;top:-90px;width:440px;height:440px;border:1px solid rgba(196,160,66,0.05);border-radius:50%;"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.08) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="background:rgba(196,160,66,0.08);border:1px solid rgba(196,160,66,0.14);border-radius:16px;padding:28px 36px;margin-bottom:44px;display:inline-block;align-self:flex-start;">
        <p style="font-size:210px;font-weight:900;color:${GOLD};line-height:0.82;letter-spacing:-0.07em;">${s.number || ""}</p>
      </div>
      <h2 style="font-size:62px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:32px;max-width:780px;">${accent(s.title)}</h2>
      <div style="display:flex;gap:20px;align-items:flex-start;">
        <div style="width:3px;background:${GOLD};border-radius:2px;flex-shrink:0;margin-top:4px;align-self:stretch;"></div>
        <p style="font-size:25px;font-weight:400;color:rgba(255,255,255,0.45);line-height:1.65;max-width:700px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v1_texto(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.022) 0px,rgba(196,160,66,0.022) 1px,transparent 1px,transparent 64px);"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.08) 100%);"></div>
  <div style="position:absolute;right:60px;top:80px;font-size:300px;font-weight:900;color:rgba(196,160,66,0.055);line-height:1;letter-spacing:-0.06em;pointer-events:none;">${n}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;background:${GOLD};padding:6px 18px;border-radius:4px;margin-bottom:32px;align-self:flex-start;"><p style="font-size:11px;font-weight:900;color:#0D0D0D;letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h2 style="font-size:92px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:44px;max-width:900px;">${accent(s.title)}</h2>
      <p style="font-size:27px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:800px;border-left:4px solid ${GOLD};padding-left:28px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v1_destaque(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:10px;background:${GOLD};"></div>
  <div style="position:absolute;left:72px;top:140px;font-size:180px;font-weight:900;color:rgba(196,160,66,0.13);line-height:1;font-family:Georgia,serif;">"</div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(196,160,66,0.018) 0px,rgba(196,160,66,0.018) 1px,transparent 1px,transparent 80px);"></div>
  <div style="position:absolute;left:0;top:10px;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.06) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:80px 80px 64px 100px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <h2 style="font-size:100px;font-weight:900;color:#FFFFFF;line-height:0.90;letter-spacing:-0.048em;margin-bottom:48px;max-width:900px;">${s.title}</h2>
      <div style="display:flex;align-items:center;gap:24px;">
        <div style="width:64px;height:3px;background:${GOLD};border-radius:2px;flex-shrink:0;"></div>
        <p style="font-size:29px;font-weight:500;color:rgba(196,160,66,0.7);line-height:1.5;max-width:720px;">${s.body || ""}</p>
      </div>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   VARIANT 2 — CINEMATIC PHOTO
   Real photo bg · Dark overlay · Huge text · Gold accents
   ═══════════════════════════════════════════════════════ */

function v2_capa(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Full-bleed photo — photo visible top half, text on bottom half -->
  <div style="position:absolute;inset:0;background-image:url('${photo}');background-size:cover;background-position:center 20%;"></div>
  <!-- Gradient: transparent at top, solid dark from midpoint down so text is readable -->
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.20) 30%,rgba(13,13,13,0.75) 52%,rgba(13,13,13,0.97) 66%,#0D0D0D 76%);"></div>
  <!-- Gold left border -->
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.15) 100%);"></div>
  <!-- Content always centered vertically -->
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 94px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      ${s.eyebrow ? `<div style="display:inline-flex;background:${GOLD};padding:7px 20px;border-radius:4px;margin-bottom:28px;align-self:flex-start;"><p style="font-size:12px;font-weight:900;color:#0D0D0D;letter-spacing:0.38em;text-transform:uppercase;">${s.eyebrow}</p></div>` : ""}
      <h1 style="font-size:132px;font-weight:900;color:#FFFFFF;line-height:0.87;letter-spacing:-0.06em;margin-bottom:36px;max-width:920px;text-shadow:0 4px 48px rgba(0,0,0,0.8);">${accent(s.title)}</h1>
      ${s.subtitle ? `<p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.7);line-height:1.5;max-width:640px;text-shadow:0 2px 20px rgba(0,0,0,0.8);">${s.subtitle}</p>` : ""}
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v2_numero(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 1);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <!-- Photo visible at top-right corner, dark below for text -->
  <div style="position:absolute;inset:0;background-image:url('${photo}');background-size:cover;background-position:center top;"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(13,13,13,0.80) 35%,rgba(13,13,13,0.97) 55%,#0D0D0D 65%);"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 94px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:56px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:32px;"></div>
      <p style="font-size:240px;font-weight:900;color:${GOLD};line-height:0.80;letter-spacing:-0.07em;margin-bottom:32px;text-shadow:0 0 80px rgba(196,160,66,0.3);">${s.number || ""}</p>
      <div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:36px;overflow:hidden;"><div style="width:74%;height:100%;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.2));border-radius:2px;"></div></div>
      <h2 style="font-size:62px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.035em;margin-bottom:28px;max-width:760px;">${accent(s.title)}</h2>
      <p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.5);line-height:1.65;max-width:720px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v2_texto(s: SlideContent, n: number, total: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <!-- Horizontal gold rule mid-slide -->
  <div style="position:absolute;top:580px;left:94px;right:80px;height:1px;background:linear-gradient(90deg,${GOLD},rgba(196,160,66,0.1));"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 94px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      ${s.eyebrow ? `<p style="font-size:12px;font-weight:800;color:${GOLD};letter-spacing:0.4em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow}</p>` : ""}
      <h2 style="font-size:96px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.047em;margin-bottom:48px;max-width:900px;">${accent(s.title)}</h2>
      <p style="font-size:27px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:820px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

function v2_destaque(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 2);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:url('${photo}');background-size:cover;background-position:center;"></div>
  <div style="position:absolute;inset:0;background:rgba(10,8,2,0.88);"></div>
  <!-- Large quote -->
  <div style="position:absolute;left:60px;top:80px;font-size:320px;font-weight:900;color:rgba(196,160,66,0.10);line-height:1;font-family:Georgia,serif;pointer-events:none;">"</div>
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.1) 100%);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:64px 80px 64px 94px;">
    ${topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;">
      <div style="width:56px;height:5px;background:${GOLD};border-radius:3px;margin-bottom:52px;"></div>
      <h2 style="font-size:96px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.047em;margin-bottom:44px;max-width:900px;">${s.title}</h2>
      <p style="font-size:30px;font-weight:500;color:rgba(196,160,66,0.72);line-height:1.5;max-width:760px;">${s.body || ""}</p>
    </div>
    ${bottomBar()}
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   CTA — 3 variants
   ═══════════════════════════════════════════════════════ */

function v0_cta(s: SlideContent) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;border:2px solid rgba(196,160,66,0.14);">
  <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:36px 36px;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1000px;height:1000px;background:radial-gradient(circle,rgba(196,160,66,0.06) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:absolute;left:-40px;bottom:40px;font-size:260px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.04em;pointer-events:none;white-space:nowrap;">UPFLU</div>
  <div style="position:absolute;top:0;left:0;width:150px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;left:0;width:3px;height:150px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;top:0;right:0;width:150px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;top:0;right:0;width:3px;height:150px;background:linear-gradient(180deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:150px;height:3px;background:linear-gradient(90deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;width:3px;height:150px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:absolute;bottom:0;right:0;width:150px;height:3px;background:linear-gradient(90deg,transparent,${GOLD});"></div>
  <div style="position:absolute;bottom:0;right:0;width:3px;height:150px;background:linear-gradient(0deg,${GOLD},transparent);"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:96px;width:auto;object-fit:contain;margin-bottom:72px;" alt="UPFLU" />
    <div style="width:56px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:60px;"></div>
    <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.045em;margin-bottom:56px;max-width:840px;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:20px 56px;margin-bottom:36px;">
      <p style="font-size:24px;font-weight:800;color:#0D0D0D;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:16px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
}

function v1_cta(s: SlideContent) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#111008;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:10px;background:${GOLD};"></div>
  <div style="position:absolute;left:0;top:10px;bottom:0;width:10px;background:linear-gradient(180deg,${GOLD} 0%,rgba(196,160,66,0.08) 100%);"></div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(196,160,66,0.018) 0px,rgba(196,160,66,0.018) 1px,transparent 1px,transparent 64px);"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:840px;height:840px;background:radial-gradient(circle,rgba(196,160,66,0.05) 0%,transparent 60%);border-radius:50%;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px 80px 80px 100px;text-align:center;">
    <img src="/upflu-logo.png" style="height:96px;width:auto;object-fit:contain;margin-bottom:64px;" alt="UPFLU" />
    <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.045em;margin-bottom:52px;max-width:840px;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:20px 60px;margin-bottom:40px;">
      <p style="font-size:24px;font-weight:800;color:#0D0D0D;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:16px;font-weight:500;color:rgba(255,255,255,0.2);letter-spacing:0.12em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
}

function v2_cta(s: SlideContent, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 5);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#0D0D0D;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  <div style="position:absolute;inset:0;background-image:url('${photo}');background-size:cover;background-position:center;"></div>
  <div style="position:absolute;inset:0;background:rgba(13,13,13,0.90);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:${GOLD};"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:${GOLD};"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:96px;width:auto;object-fit:contain;margin-bottom:72px;" alt="UPFLU" />
    <div style="width:56px;height:4px;background:${GOLD};border-radius:2px;margin-bottom:60px;"></div>
    <h2 style="font-size:80px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.045em;margin-bottom:56px;max-width:840px;">${accent(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:20px 56px;margin-bottom:36px;">
      <p style="font-size:24px;font-weight:800;color:#0D0D0D;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:16px;font-weight:500;color:rgba(255,255,255,0.22);letter-spacing:0.12em;text-transform:uppercase;">IA para pequenos negócios</p>
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   VARIANT 3 — FUTURISTIC CENTERED
   Full-bleed photo · Gold grid overlay · Corner brackets
   HUD scan line · Title centered + glow on highlight
   ═══════════════════════════════════════════════════════ */

function accentGlow(text: string): string {
  return (text || "").replace(
    /\{\{(.*?)\}\}/g,
    `<span style="color:${GOLD};text-shadow:0 0 28px rgba(196,160,66,0.85),0 0 56px rgba(196,160,66,0.4);">$1</span>`
  );
}

function v3_frame(photoUrl: string) {
  return `
  <div style="position:absolute;inset:0;background-image:url('${photoUrl}');background-size:cover;background-position:center;"></div>
  <div style="position:absolute;inset:0;background:rgba(4,4,6,0.74);"></div>
  <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(196,160,66,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(196,160,66,0.035) 1px,transparent 1px);background-size:68px 68px;"></div>
  <div style="position:absolute;top:54px;left:54px;width:52px;height:52px;border-top:2px solid ${GOLD};border-left:2px solid ${GOLD};opacity:0.7;"></div>
  <div style="position:absolute;top:54px;right:54px;width:52px;height:52px;border-top:2px solid ${GOLD};border-right:2px solid ${GOLD};opacity:0.7;"></div>
  <div style="position:absolute;bottom:54px;left:54px;width:52px;height:52px;border-bottom:2px solid ${GOLD};border-left:2px solid ${GOLD};opacity:0.7;"></div>
  <div style="position:absolute;bottom:54px;right:54px;width:52px;height:52px;border-bottom:2px solid ${GOLD};border-right:2px solid ${GOLD};opacity:0.7;"></div>
  <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:1px;height:100%;background:linear-gradient(180deg,transparent,rgba(196,160,66,0.10),transparent);pointer-events:none;"></div>
  <div style="position:absolute;top:42%;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(196,160,66,0.22),transparent);pointer-events:none;"></div>`;
}

function v3_topBar(n: number, total: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
    <img src="/upflu-logo.png" style="height:44px;width:auto;object-fit:contain;filter:drop-shadow(0 0 8px rgba(196,160,66,0.35));" alt="UPFLU" />
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:6px;height:6px;background:${GOLD};border-radius:50%;box-shadow:0 0 8px ${GOLD};"></div>
      <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:0.22em;font-family:Inter,sans-serif;">${String(n).padStart(2,"0")} / ${String(total).padStart(2,"0")}</span>
    </div>
  </div>`;
}

function v3_bottomBar(handle = "@upfluagencia") {
  return `<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:24px;height:1px;background:${GOLD};box-shadow:0 0 6px rgba(196,160,66,0.5);"></div>
      <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.28);letter-spacing:0.1em;font-family:Inter,sans-serif;">${handle}</span>
    </div>
    <div style="font-size:10px;font-weight:700;color:rgba(196,160,66,0.35);letter-spacing:0.3em;text-transform:uppercase;font-family:Inter,sans-serif;">UPFLU.DIGITAL</div>
  </div>`;
}

function v3_capa(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#040406;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  ${v3_frame(photo)}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${v3_topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:36px;"><div style="width:20px;height:1px;background:${GOLD};box-shadow:0 0 6px ${GOLD};"></div><p style="font-size:11px;font-weight:800;color:${GOLD};letter-spacing:0.42em;text-transform:uppercase;text-shadow:0 0 12px rgba(196,160,66,0.6);">${s.eyebrow}</p><div style="width:20px;height:1px;background:${GOLD};box-shadow:0 0 6px ${GOLD};"></div></div>` : ""}
      <h1 style="font-size:130px;font-weight:900;color:#FFFFFF;line-height:0.88;letter-spacing:-0.055em;margin-bottom:40px;max-width:940px;text-shadow:0 4px 60px rgba(0,0,0,0.9);text-align:center;">${accentGlow(s.title)}</h1>
      ${s.subtitle ? `<div style="width:48px;height:2px;background:${GOLD};border-radius:1px;margin:0 auto 24px;box-shadow:0 0 10px ${GOLD};"></div><p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.55;max-width:620px;text-align:center;text-shadow:0 2px 20px rgba(0,0,0,0.8);">${s.subtitle}</p>` : ""}
    </div>
    ${v3_bottomBar()}
  </div>
</div></body></html>`;
}

function v3_numero(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 3);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#040406;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  ${v3_frame(photo)}
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:560px;font-weight:900;color:rgba(196,160,66,0.04);line-height:1;letter-spacing:-0.08em;white-space:nowrap;pointer-events:none;">${s.number || ""}</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${v3_topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      <p style="font-size:220px;font-weight:900;color:${GOLD};line-height:0.82;letter-spacing:-0.07em;margin-bottom:28px;text-shadow:0 0 60px rgba(196,160,66,0.5),0 0 120px rgba(196,160,66,0.2);">${s.number || ""}</p>
      <div style="width:80px;height:2px;background:${GOLD};border-radius:1px;margin:0 auto 32px;box-shadow:0 0 10px ${GOLD};"></div>
      <h2 style="font-size:58px;font-weight:900;color:#FFFFFF;line-height:0.97;letter-spacing:-0.033em;margin-bottom:28px;max-width:800px;text-align:center;">${accentGlow(s.title)}</h2>
      <p style="font-size:23px;font-weight:400;color:rgba(255,255,255,0.48);line-height:1.65;max-width:680px;text-align:center;">${s.body || ""}</p>
    </div>
    ${v3_bottomBar()}
  </div>
</div></body></html>`;
}

function v3_texto(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 4);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#040406;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  ${v3_frame(photo)}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${v3_topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      ${s.eyebrow ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:32px;"><div style="width:20px;height:1px;background:${GOLD};box-shadow:0 0 6px ${GOLD};"></div><p style="font-size:11px;font-weight:800;color:${GOLD};letter-spacing:0.42em;text-transform:uppercase;">${s.eyebrow}</p><div style="width:20px;height:1px;background:${GOLD};box-shadow:0 0 6px ${GOLD};"></div></div>` : ""}
      <h2 style="font-size:88px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.045em;margin-bottom:44px;max-width:900px;text-align:center;text-shadow:0 4px 40px rgba(0,0,0,0.9);">${accentGlow(s.title)}</h2>
      <div style="width:48px;height:2px;background:${GOLD};border-radius:1px;margin:0 auto 36px;box-shadow:0 0 10px ${GOLD};"></div>
      <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.52);line-height:1.65;max-width:760px;text-align:center;">${s.body || ""}</p>
    </div>
    ${v3_bottomBar()}
  </div>
</div></body></html>`;
}

function v3_destaque(s: SlideContent, n: number, total: number, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 6);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#040406;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  ${v3_frame(photo)}
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:400px;font-weight:900;color:rgba(196,160,66,0.05);line-height:1;font-family:Georgia,serif;pointer-events:none;white-space:nowrap;">"</div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:72px 80px;">
    ${v3_topBar(n, total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;">
      <div style="width:1px;height:60px;background:linear-gradient(180deg,transparent,${GOLD});margin:0 auto 40px;box-shadow:0 0 10px rgba(196,160,66,0.4);"></div>
      <h2 style="font-size:90px;font-weight:900;color:#FFFFFF;line-height:0.91;letter-spacing:-0.046em;margin-bottom:44px;max-width:920px;text-align:center;text-shadow:0 4px 40px rgba(0,0,0,0.9);">${s.title}</h2>
      <div style="width:1px;height:60px;background:linear-gradient(180deg,${GOLD},transparent);margin:0 auto 36px;box-shadow:0 0 10px rgba(196,160,66,0.4);"></div>
      <p style="font-size:28px;font-weight:500;color:rgba(196,160,66,0.75);line-height:1.5;max-width:740px;text-align:center;">${s.body || ""}</p>
    </div>
    ${v3_bottomBar()}
  </div>
</div></body></html>`;
}

function v3_cta(s: SlideContent, photoSeed: number) {
  const photo = pickPhoto(photoSeed + 7);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#040406;font-family:Inter,sans-serif;position:relative;overflow:hidden;">
  ${v3_frame(photo)}
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:720px;height:720px;border:1px solid rgba(196,160,66,0.08);border-radius:50%;pointer-events:none;"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:500px;height:500px;border:1px solid rgba(196,160,66,0.06);border-radius:50%;pointer-events:none;"></div>
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:80px;text-align:center;">
    <img src="/upflu-logo.png" style="height:88px;width:auto;object-fit:contain;margin-bottom:56px;filter:drop-shadow(0 0 16px rgba(196,160,66,0.4));" alt="UPFLU" />
    <div style="width:48px;height:2px;background:${GOLD};border-radius:1px;margin:0 auto 48px;box-shadow:0 0 12px ${GOLD};"></div>
    <h2 style="font-size:76px;font-weight:900;color:#FFFFFF;line-height:0.93;letter-spacing:-0.044em;margin-bottom:52px;max-width:840px;text-shadow:0 4px 40px rgba(0,0,0,0.9);">${accentGlow(s.title)}</h2>
    <div style="background:${GOLD};border-radius:100px;padding:20px 56px;margin-bottom:32px;box-shadow:0 0 40px rgba(196,160,66,0.35);">
      <p style="font-size:24px;font-weight:800;color:#040406;letter-spacing:0.06em;">${s.handle || "@upfluagencia"}</p>
    </div>
    <p style="font-size:13px;font-weight:600;color:rgba(196,160,66,0.3);letter-spacing:0.28em;text-transform:uppercase;">IA PARA PEQUENOS NEGÓCIOS</p>
  </div>
</div></body></html>`;
}

/* ═══════════════════════════════════════════════════════
   Public API
   variant 0 = Dark Tech
   variant 1 = Editorial Bold
   variant 2 = Cinematic Photo
   variant 3 = Futuristic Centered (HUD + glow)
   ═══════════════════════════════════════════════════════ */

export function renderSlide(
  s: SlideContent,
  n: number,
  total: number,
  variant = 0,
  photoSeed = 0
): string {
  const v = variant % 4;
  switch (s.type) {
    case "capa":
      return v === 0 ? v0_capa(s, n, total)
           : v === 1 ? v1_capa(s, n, total)
           : v === 2 ? v2_capa(s, n, total, photoSeed)
           : v3_capa(s, n, total, photoSeed);
    case "numero":
      return v === 0 ? v0_numero(s, n, total)
           : v === 1 ? v1_numero(s, n, total)
           : v === 2 ? v2_numero(s, n, total, photoSeed)
           : v3_numero(s, n, total, photoSeed);
    case "texto":
      return v === 0 ? v0_texto(s, n, total)
           : v === 1 ? v1_texto(s, n, total)
           : v === 2 ? v2_texto(s, n, total)
           : v3_texto(s, n, total, photoSeed);
    case "destaque":
      return v === 0 ? v0_destaque(s, n, total)
           : v === 1 ? v1_destaque(s, n, total)
           : v === 2 ? v2_destaque(s, n, total, photoSeed)
           : v3_destaque(s, n, total, photoSeed);
    case "cta":
    default:
      return v === 0 ? v0_cta(s)
           : v === 1 ? v1_cta(s)
           : v === 2 ? v2_cta(s, photoSeed)
           : v3_cta(s, photoSeed);
  }
}
