import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function sha256(val: string): string {
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { pixelId, accessToken, eventName, phone, email } = await req.json();

    if (!pixelId || !accessToken || !eventName) {
      return NextResponse.json(
        { error: "pixelId, accessToken e eventName são obrigatórios" },
        { status: 400 },
      );
    }

    const userData: Record<string, string[]> = {};

    if (phone) {
      const clean = phone.replace(/\D/g, "");
      const normalized = clean.startsWith("55") ? clean : `55${clean}`;
      userData.ph = [sha256(normalized)];
    }

    if (email) {
      userData.em = [sha256(email.trim().toLowerCase())];
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "other",
          user_data: Object.keys(userData).length > 0 ? userData : { client_ip_address: "0.0.0.0" },
        },
      ],
      access_token: accessToken,
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro na Meta API" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      eventsReceived: data.events_received,
      fbtrace_id: data.fbtrace_id,
    });
  } catch {
    return NextResponse.json({ error: "Erro de conexão com a Meta" }, { status: 500 });
  }
}
