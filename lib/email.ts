import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
  await transporter.sendMail({
    from: `"Upflu" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/login`
    : "https://adm.upflu.digital/portal/login";

  await transporter.sendMail({
    from: `"Upflu" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Seu acesso ao Portal Upflu está pronto",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Arial,sans-serif}
  .wrap{max-width:520px;margin:40px auto;background:#111111;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden}
  .top{background:linear-gradient(135deg,rgba(0,207,255,0.12),rgba(0,207,255,0.04));padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.07)}
  .logo{font-size:13px;font-weight:700;color:#00CFFF;letter-spacing:0.15em;margin:0 0 18px}
  .title{font-size:24px;font-weight:700;color:#F0EDE8;margin:0;letter-spacing:-0.03em}
  .body{padding:32px 40px}
  .label{font-size:11px;font-weight:600;color:#777068;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 6px}
  .value{font-size:15px;color:#F0EDE8;margin:0 0 20px;font-weight:500}
  .field{background:#080808;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px 16px;margin-bottom:10px}
  .field-label{font-size:10px;color:#777068;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px}
  .field-value{font-size:14px;color:#00CFFF;font-weight:600;margin:0;font-family:monospace}
  .btn{display:block;width:100%;box-sizing:border-box;padding:16px;background:#00CFFF;border-radius:10px;text-align:center;text-decoration:none;color:#080808;font-size:14px;font-weight:700;letter-spacing:0.02em;margin-top:24px}
  .footer{padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center}
  .footer p{font-size:12px;color:#555;margin:0}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <p class="logo">UPFLU</p>
    <h1 class="title">Bem-vindo ao seu portal, ${name.split(" ")[0]}.</h1>
  </div>
  <div class="body">
    <p style="font-size:14px;color:#9A9288;margin:0 0 24px;line-height:1.6">
      Seu onboarding foi concluído. A partir de agora você tem acesso ao seu painel de cliente onde pode acompanhar propostas, contratos e pagamentos.
    </p>

    <div class="field">
      <p class="field-label">Login (email)</p>
      <p class="field-value">${email}</p>
    </div>
    <div class="field">
      <p class="field-label">Senha</p>
      <p class="field-value">${password}</p>
    </div>

    <a href="${portalUrl}" class="btn">Acessar Portal →</a>

    <p style="font-size:12px;color:#555;margin:16px 0 0;text-align:center">
      Ou acesse: <span style="color:#777068">${portalUrl}</span>
    </p>
  </div>
  <div class="footer">
    <p>Upflu · IA & Automação</p>
  </div>
</div>
</body>
</html>
    `.trim(),
  });
}
