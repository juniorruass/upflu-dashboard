import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("upflu-portal-session", "", { maxAge: 0, path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(new URL("/portal/login", process.env.NEXT_PUBLIC_APP_URL ?? "https://adm.upflu.digital"));
  res.cookies.set("upflu-portal-session", "", { maxAge: 0, path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}
