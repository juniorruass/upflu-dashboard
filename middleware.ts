import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicAsset =
    pathname.startsWith("/_next/") || pathname.includes(".");

  if (isApiRoute || isPublicAsset) {
    return NextResponse.next();
  }

  const SESSION_SECRET = (process.env.SESSION_SECRET || "")
    .replace(/^﻿/, "")
    .trim();
  const sessionCookie = request.cookies.get("upflu-session")?.value;
  const isAuthenticated =
    Boolean(SESSION_SECRET) && sessionCookie === SESSION_SECRET;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
