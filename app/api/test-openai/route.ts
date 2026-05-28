import { NextResponse } from "next/server";

export async function GET() {
  const key = (process.env.OPENAI_API_KEY || "").trim();

  if (!key) {
    return NextResponse.json({ ok: false, reason: "OPENAI_API_KEY não está definida no ambiente" });
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A dark professional background, no text",
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const url = response.data?.[0]?.url ?? "";
    return NextResponse.json({ ok: true, url, keyPrefix: key.slice(0, 8) + "..." });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      keyPrefix: key.slice(0, 8) + "...",
    });
  }
}
