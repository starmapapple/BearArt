import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE, createAdminToken, getAdminPassword } from "@/lib/adminSession";

export async function POST(request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const next = safeNext(String(form.get("next") || "/admin"));
  const expected = getAdminPassword();

  if (!expected || password !== expected) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE_NAME, await createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
  return response;
}

function safeNext(value) {
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}
