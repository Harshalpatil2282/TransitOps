import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// The client uses the backend's NextAuth session or creates its own
// Since backend APIs are publicly accessible (middleware disabled),
// we validate via the backend's /api/auth/signin endpoint pattern.
// Simplest: call the backend API /api/users to find user and validate.
// But backend doesn't expose password check. So we re-use the same
// DB credentials check by calling backend's own NextAuth signin.

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        try {
          // Use the backend's auth/check endpoint
          const res = await fetch(`${API_BASE}/api/auth/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: 'no-store',
          })
          if (res.ok) {
            const json = await res.json()
            const user = json.data || json
            if (user?.id) {
              return { id: user.id, email: user.email, name: user.name, role: user.role }
            }
          }
          return null
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.sub
      }
      return session
    },
  },
}
