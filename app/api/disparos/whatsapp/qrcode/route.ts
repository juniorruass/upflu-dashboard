import { NextRequest, NextResponse } from "next/server";

const ZAPI_BASE = "https://api.z-api.io/instances";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get("instanceId");
  const token      = searchParams.get("token");

  if (!instanceId || !token) {
    return new NextResponse("Parâmetros ausentes", { status: 400 });
  }

  try {
    // Z-API retorna JSON com campo base64, não imagem direta
    const res = await fetch(
      `${ZAPI_BASE}/${instanceId}/token/${token}/qr-code`,
      { signal: AbortSignal.timeout(10000) }
    );

    const data = await res.json();

    // Extrai base64 — pode vir com ou sem prefixo data:image
    const raw: string = data.base64 || data.qrCode || data.value || "";

    if (!raw) {
      return NextResponse.json({ error: "QR Code não disponível", raw: data }, { status: 404 });
    }

    let b64 = raw;
    let mime = "image/png";

    if (raw.startsWith("data:")) {
      const match = raw.match(/^data:(.*?);base64,(.*)$/);
      if (match) { mime = match[1]; b64 = match[2]; }
    }

    const buffer = Buffer.from(b64, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": mime, "Cache-Control": "no-store" },
    });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
