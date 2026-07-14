import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

// ── Auth helpers ────────────────────────────────────────────────────────────

// Portal cookies are named portal_${slug} and guardam um JWT assinado (ver lib/portal-session.ts)
async function isPortalAuthed(req: NextRequest): Promise<boolean> {
  const ids = await getPortalClientIds(req);
  return ids.length > 0;
}

// ── Route classification ────────────────────────────────────────────────────

// Fully public — no auth needed (cron routes self-authenticate via CRON_SECRET)
const PUBLIC_API: string[] = [
  "/api/auth/",
  "/api/cron/",
  "/api/portal/auth",   // portal login / logout
  "/api/dashboard/summary", // consumida pelo Lilly's, self-autentica via ADM_API_SECRET
  "/api/dashboard/campaigns-report", // consumida pelo Lilly's, self-autentica via ADM_API_SECRET
];

// Accessible by admin OR authenticated portal client
const PORTAL_OR_ADMIN_API: string[] = [
  "/api/meta/",
  "/api/instagram/",
  "/api/push/",
  "/api/portal/",
];

// Everything else under /api/ requires admin session

// ── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — skip entirely
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // ── API routes ─────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Fully public
    if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const adminOk  = await isAdminAuthed(request);
    const portalOk = await isPortalAuthed(request);

    // Portal-or-admin accessible
    if (PORTAL_OR_ADMIN_API.some((p) => pathname.startsWith(p))) {
      if (adminOk || portalOk) return NextResponse.next();
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Everything else: admin only
    if (!adminOk) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Public booking page ─────────────────────────────────────────────
  if (pathname.startsWith("/agendar")) return NextResponse.next();

  // ── Client slug pages (public portal, ex: /arthur) ─────────────────
  const ADMIN_PREFIXES = ["/dashboard", "/login", "/portal", "/api", "/agendar", "/_next"];
  const isClientSlug =
    !ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) &&
    pathname.split("/").filter(Boolean).length === 1;
  if (isClientSlug) return NextResponse.next();

  // ── Portal pages (/portal/*) ────────────────────────────────────────
  if (pathname.startsWith("/portal")) {
    const isPortalLogin = pathname === "/portal/login";
    const portalAuthed  = await isPortalAuthed(request);

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

  // ── Admin pages ─────────────────────────────────────────────────────
  const isLoginPage  = pathname === "/login";
  const adminAuthed  = await isAdminAuthed(request);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = adminAuthed ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!adminAuthed && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (adminAuthed && isLoginPage) {
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
