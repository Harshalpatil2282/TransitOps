'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Truck, Users, MapPin, Wrench,
  Fuel, BarChart2, Settings, LogOut
} from 'lucide-react'

type Role = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'

const navItems = [
  { label: 'Dashboard',       href: '/dashboard',              icon: LayoutDashboard, roles: ['FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER','FINANCIAL_ANALYST'] as Role[] },
  { label: 'Vehicles',        href: '/fleet/vehicles',         icon: Truck,            roles: ['FLEET_MANAGER'] as Role[] },
  { label: 'Drivers',         href: '/fleet/drivers',          icon: Users,            roles: ['FLEET_MANAGER','DISPATCHER','SAFETY_OFFICER'] as Role[] },
  { label: 'Trips',           href: '/operations/trips',       icon: MapPin,           roles: ['FLEET_MANAGER','DISPATCHER'] as Role[] },
  { label: 'Maintenance',     href: '/operations/maintenance', icon: Wrench,           roles: ['FLEET_MANAGER'] as Role[] },
  { label: 'Fuel & Expenses', href: '/finance/fuel',           icon: Fuel,             roles: ['FLEET_MANAGER','FINANCIAL_ANALYST'] as Role[] },
  { label: 'Analytics',       href: '/analytics',              icon: BarChart2,        roles: ['FLEET_MANAGER','FINANCIAL_ANALYST','SAFETY_OFFICER'] as Role[] },
  { label: 'Settings',        href: '/settings',               icon: Settings,         roles: ['FLEET_MANAGER'] as Role[] },
]

const roleBadgeColor: Record<Role, string> = {
  FLEET_MANAGER:     'bg-blue-500/20 text-blue-400',
  DISPATCHER:        'bg-green-500/20 text-green-400',
  SAFETY_OFFICER:    'bg-yellow-500/20 text-yellow-400',
  FINANCIAL_ANALYST: 'bg-purple-500/20 text-purple-400',
}

const roleLabel: Record<Role, string> = {
  FLEET_MANAGER:     'Fleet Manager',
  DISPATCHER:        'Dispatcher',
  SAFETY_OFFICER:    'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

function getInitials(name?: string | null) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as Role | undefined

  return (
    <aside className="flex flex-col h-full w-[230px] bg-slate-900 border-r border-slate-700/60 flex-shrink-0">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-4 pt-5 pb-3">
        <Image
          src="/logo.png"
          alt="TransitOps Logo"
          width={160}
          height={90}
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      <div className="mx-4 border-t border-slate-700/50" />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems
          .filter(item => !role || item.roles.includes(role))
          .map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                {item.label}
              </Link>
            )
          })}
      </nav>

      <div className="mx-4 border-t border-slate-700/50" />

      {/* ── User ─────────────────────────────────────────────────── */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
            {getInitials(session?.user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-slate-100 text-sm font-semibold truncate">{session?.user?.name || 'User'}</p>
            {role && (
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleBadgeColor[role]}`}>
                {roleLabel[role]}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
