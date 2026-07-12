import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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
        try {
          const res = await fetch(`${API_BASE}/api/auth/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: 'no-store',
          })
          // Backend returns { success: true, data: { id, email, name, role } }
          const json = await res.json()
          if (!res.ok || !json.success) return null
          const user = json.data
          if (!user?.id) return null
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch (e) {
          console.error('Auth check failed:', e)
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
