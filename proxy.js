import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminSession";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const protectedAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const protectedAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";
  const protectedOrderRead = pathname === "/api/orders" && request.method === "GET";
  const protectedExport = pathname === "/api/orders/export";

  if (!protectedAdminPage && !protectedAdminApi && !protectedOrderRead && !protectedExport) {
    return NextResponse.next();
  }

  const verified = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (verified) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/orders", "/api/orders/export"]
};
