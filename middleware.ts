import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Prevent directory traversal attacks in pathname, search, or encoded URL
  const rawUrl = request.url;
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  if (
    rawUrl.includes("%2e%2e") ||
    rawUrl.includes("..") ||
    pathname.includes("..") ||
    pathname.includes("//") ||
    search.includes("..")
  ) {
    return new NextResponse("Bad Request - Malformed Path", { status: 400 });
  }

  const response = NextResponse.next();

  // Enterprise Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Enforce HSTS for production deployments
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (robots.txt, manifest.json, images)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|logo.svg).*)",
  ],
};
