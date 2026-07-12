'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Zap, AlertCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const demoAccounts = [
  { emoji: '🔵', role: 'Fleet Manager',     email: 'fleet@transitops.com' },
  { emoji: '🟢', role: 'Dispatcher',         email: 'dispatch@transitops.com' },
  { emoji: '🟡', role: 'Safety Officer',     email: 'safety@transitops.com' },
  { emoji: '🟣', role: 'Financial Analyst',  email: 'finance@transitops.com' },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid credentials. Please try again.')
    } else {
      router.push('/dashboard')
    }
  }

  const fillDemo = (email: string) => {
    setValue('email', email)
    setValue('password', 'password123')
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-amber-400 tracking-tight">TransitOps</h1>
          <p className="text-slate-400 text-sm mt-1">Smart Transport Platform</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@transitops.com"
              className={`w-full ${errors.email ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('remember')} type="checkbox" className="w-4 h-4 rounded border-slate-600 accent-amber-500" />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>
            <button type="button" className="text-sm text-slate-400 hover:text-amber-400 transition-colors">
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Demo accounts */}
      <div className="mt-4 bg-slate-900 rounded-xl p-5 border border-slate-700/60">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Demo Accounts <span className="text-slate-500 font-normal normal-case">(password: password123)</span>
        </p>
        <div className="space-y-2">
          {demoAccounts.map(acc => (
            <button
              key={acc.email}
              onClick={() => fillDemo(acc.email)}
              className="w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left group"
            >
              <span className="flex items-center gap-2 text-slate-300">
                <span>{acc.emoji}</span>
                <span className="font-medium">{acc.role}</span>
              </span>
              <span className="text-slate-500 text-xs group-hover:text-amber-400 transition-colors font-mono">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
