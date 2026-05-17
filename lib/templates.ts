const FONT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`;
const BASE = `*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}`;

function counter(n: number, total: number) {
  return `${String(n).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

function header(n: number, total: number, dark = true) {
  const color = dark ? "#00C896" : "#0a5c43";
  const muted = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">
    <span style="font-size:17px;font-weight:800;color:${color};letter-spacing:0.06em;">UPFLU</span>
    <span style="font-size:14px;font-weight:500;color:${muted};letter-spacing:0.18em;">${counter(n, total)}</span>
  </div>`;
}

function wrap(content: string, bg: string, n: number, total: number, dark = true) {
  const isDark = dark;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:${bg};font-family:'Inter','Helvetica Neue',Arial,sans-serif;position:relative;display:flex;flex-direction:column;padding:72px 88px;overflow:hidden;">
  ${header(n, total, isDark)}
  ${content}
</div></body></html>`;
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
    case "capa":
      return wrap(`
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px 0 32px;">
          <div style="width:64px;height:4px;background:#00C896;margin-bottom:28px;border-radius:2px;"></div>
          <p style="font-size:13px;font-weight:800;color:#00C896;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:32px;">${s.eyebrow || ""}</p>
          <h1 style="font-size:96px;font-weight:900;color:#FAFAF7;line-height:0.93;letter-spacing:-0.04em;margin-bottom:36px;">${s.title}</h1>
          <p style="font-size:26px;font-weight:400;color:rgba(255,255,255,0.5);line-height:1.4;max-width:680px;">${s.subtitle || ""}</p>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:28px;">
          <span style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.05em;">@upflu.digital</span>
        </div>`, "#0E1116", n, total, true);

    case "numero":
      return wrap(`
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px 0;">
          <div style="width:64px;height:4px;background:#00C896;margin-bottom:48px;border-radius:2px;"></div>
          <p style="font-size:200px;font-weight:900;color:#00C896;line-height:0.85;letter-spacing:-0.05em;margin-bottom:40px;">${s.number || ""}</p>
          <h2 style="font-size:52px;font-weight:800;color:#1A1A1A;line-height:1.05;letter-spacing:-0.03em;margin-bottom:24px;max-width:700px;">${s.title}</h2>
          <p style="font-size:22px;font-weight:400;color:#555;line-height:1.55;max-width:700px;">${s.body || ""}</p>
        </div>
        <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:28px;">
          <span style="font-size:15px;font-weight:600;color:#aaa;letter-spacing:0.05em;">@upflu.digital</span>
        </div>`, "#F5ECD7", n, total, false);

    case "texto":
      return wrap(`
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px 0;">
          <div style="width:64px;height:4px;background:#00C896;margin-bottom:28px;border-radius:2px;"></div>
          <p style="font-size:13px;font-weight:800;color:#00C896;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:28px;">${s.eyebrow || ""}</p>
          <h2 style="font-size:64px;font-weight:900;color:#FAFAF7;line-height:1.0;letter-spacing:-0.035em;margin-bottom:36px;max-width:820px;">${s.title}</h2>
          <p style="font-size:24px;font-weight:400;color:rgba(255,255,255,0.55);line-height:1.6;max-width:780px;">${s.body || ""}</p>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:28px;">
          <span style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.05em;">@upflu.digital</span>
        </div>`, "#0E1116", n, total, true);

    case "destaque":
      return wrap(`
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px 0;">
          <div style="width:64px;height:4px;background:#0a5c43;margin-bottom:48px;border-radius:2px;"></div>
          <h2 style="font-size:72px;font-weight:900;color:#0a3d2a;line-height:0.97;letter-spacing:-0.04em;margin-bottom:36px;max-width:820px;">${s.title}</h2>
          <p style="font-size:26px;font-weight:500;color:#0a5c43;line-height:1.5;max-width:700px;">${s.body || ""}</p>
        </div>
        <div style="border-top:1px solid rgba(0,0,0,0.12);padding-top:28px;">
          <span style="font-size:15px;font-weight:600;color:#0a5c43;letter-spacing:0.05em;">@upflu.digital</span>
        </div>`, "#00C896", n, total, false);

    case "cta":
    default:
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONT}${BASE}</style></head><body>
<div style="width:1080px;height:1350px;background:#00C896;font-family:'Inter','Helvetica Neue',Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:88px;text-align:center;overflow:hidden;">
  <div style="width:80px;height:80px;background:#0a3d2a;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:40px;">
    <span style="font-size:28px;font-weight:900;color:#00C896;">U</span>
  </div>
  <span style="font-size:32px;font-weight:900;color:#0a3d2a;letter-spacing:0.08em;margin-bottom:60px;">UPFLU</span>
  <div style="width:60px;height:4px;background:#0a5c43;border-radius:2px;margin-bottom:48px;"></div>
  <h2 style="font-size:64px;font-weight:900;color:#0a1f17;line-height:0.97;letter-spacing:-0.04em;margin-bottom:40px;max-width:760px;">${s.title}</h2>
  <p style="font-size:26px;font-weight:600;color:#0a5c43;letter-spacing:0.04em;">${s.handle || "@upflu.digital"}</p>
</div></body></html>`;
  }
}
