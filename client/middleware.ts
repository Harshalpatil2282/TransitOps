export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/fleet/:path*',
    '/operations/:path*',
    '/finance/:path*',
    '/analytics/:path*',
    '/settings/:path*',
  ],
}
