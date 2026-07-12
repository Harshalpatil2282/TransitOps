// Auth middleware is disabled for the backend API server.
// All /api/* routes are publicly accessible.
// The frontend client should handle authentication via NextAuth sessions.
//
// To re-enable JWT protection, uncomment the block below:
//
// export { default } from "next-auth/middleware";
// export const config = {
//   matcher: ["/api/vehicles/:path*", "/api/drivers/:path*", ...],
// };

export function middleware() {}
export const config = { matcher: [] };
