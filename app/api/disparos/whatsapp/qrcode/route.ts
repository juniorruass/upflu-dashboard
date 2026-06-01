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
    const res = await fetch(
      `${ZAPI_BASE}/${instanceId}/token/${token}/qr-code/image`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      return new NextResponse("QR Code indisponível", { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return new NextResponse(String(e), { status: 500 });
  }
}
