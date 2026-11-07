// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/", "/login", "/api/sports/public"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, favicon, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Allow API routes through (API routes handle their own auth & return 401/403 JSON)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  // Unauthenticated user
  if (!token) {
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists -> verify
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const role = (payload.role as string) || "player";

    // If logged in and visiting /login, redirect to role dashboard
    if (pathname === "/login") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    // Root path / -> redirect to role dashboard for logged-in users
    if (pathname === "/") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    // Sports section removed from coach portal; redirect to coach dashboard
    if (pathname.startsWith("/coach/sports")) {
      return NextResponse.redirect(new URL("/coach", request.url));
    }

    // Role-based route guarding
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (pathname.startsWith("/coach") && role !== "coach") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (pathname.startsWith("/player") && role !== "player") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (pathname.startsWith("/scout") && role !== "scout") {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    return NextResponse.next();
  } catch {
    // If token is invalid or expired, clear cookie
    if (pathname === "/") {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
