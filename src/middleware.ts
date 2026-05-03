import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth;
  const path = nextUrl.pathname;

  const isProtected =
    path.startsWith("/dashboard") || path.startsWith("/projects");
  const isAuthPage = path === "/login" || path === "/register";

  if (isProtected && !isAuthed) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|embed).*)"],
};
