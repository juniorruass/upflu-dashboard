import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute    = pathname.startsWith("/api/");
  const isPublicAsset = pathname.startsWith("/_next/") || pathname.includes(".");

  // Página pública de agendamento — sem auth
  const isPublicBooking = pathname.startsWith("/agendar");

  // Páginas públicas de cliente (slug único, ex: /arthur)
  const ADMIN_PREFIXES = ["/dashboard", "/login", "/portal", "/api", "/agendar", "/_next"];
  const isClientSlug =
    !ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) &&
    pathname.split("/").filter(Boolean).length === 1;

  if (isApiRoute || isPublicAsset || isPublicBooking || isClientSlug) return NextResponse.next();

  // ── Portal do cliente ──
  if (pathname.startsWith("/portal")) {
    const isPortalLogin   = pathname === "/portal/login";
    const portalSession   = request.cookies.get("upflu-portal-session")?.value;
    const portalAuthed    = Boolean(portalSession);

    if (!portalAuthed && !isPortalLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
    if (portalAuthed && isPortalLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Admin ──
  const isLoginPage = pathname === "/login";
  const SESSION_SECRET = (process.env.SESSION_SECRET || "").replace(/^﻿/, "").trim();
  const sessionCookie  = request.cookies.get("upflu-session")?.value;
  const isAuthenticated = Boolean(SESSION_SECRET) && sessionCookie === SESSION_SECRET;

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
