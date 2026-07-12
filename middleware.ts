export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/fleet/:path*",
    "/drivers/:path*",
    "/trips/:path*",
    "/maintenance/:path*",
    "/fuel/:path*",
    "/analytics/:path*",
    "/finance/:path*",
    "/settings/:path*",
  ],
};
