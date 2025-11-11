import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 👇 ESTA LÍNEA era el problema antes — pero aquí sí está correcta:
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const publicPaths = [
    "/",
    "/about",
    "/services",
    "/contact",
    "/authentication/login",
    "/authentication/signup",
    "/authentication/reset-password",
    "/authentication/verify",
  ];

  const isPublicPath = publicPaths.some(
    (path) =>
      req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
  );

  if (!session && !isPublicPath) {
    const loginUrl = new URL("/authentication/login", req.url);
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
