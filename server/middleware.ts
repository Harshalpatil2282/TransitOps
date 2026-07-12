export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/api/vehicles/:path*",
    "/api/drivers/:path*",
    "/api/trips/:path*",
    "/api/maintenance/:path*",
    "/api/fuel/:path*",
    "/api/expenses/:path*",
    "/api/dashboard/:path*",
    "/api/analytics/:path*",
    "/api/finance/:path*",
    "/api/users/:path*",
  ],
};
