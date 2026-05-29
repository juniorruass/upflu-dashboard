import { NextResponse } from "next/server";

export async function GET() {
  const key = (process.env.OPENAI_API_KEY || "").trim();

  if (!key) {
    return NextResponse.json({ ok: false, reason: "OPENAI_API_KEY não está definida no ambiente" });
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.images.generate as any)({
      model: "gpt-image-1",
      prompt: "A dark professional background, no text",
      n: 1,
      size: "1024x1024",
      quality: "low",
      output_format: "jpeg",
    });

    const b64 = response.data?.[0]?.b64_json ?? "";
    const dataUrl = b64 ? `data:image/jpeg;base64,${b64}` : "";
    return NextResponse.json({
      ok: true,
      hasImage: !!dataUrl,
      sizeKB: Math.round(b64.length * 0.75 / 1024),
      keyPrefix: key.slice(0, 8) + "...",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      keyPrefix: key.slice(0, 8) + "...",
    });
  }
}
