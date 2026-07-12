'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, Minus } from 'lucide-react'
import { apiGet, apiPatch } from '@/lib/api'
import { User, Role } from '@/lib/types'
import { useToast } from '@/components/ui/toast'

type Permission = 'manage:vehicles' | 'manage:drivers' | 'manage:trips' | 'manage:maintenance' | 'view:finance' | 'manage:finance' | 'view:analytics' | 'manage:settings'

const rolePermissions: Record<Role, Permission[]> = {
  FLEET_MANAGER:     ['manage:vehicles', 'manage:maintenance', 'view:analytics', 'manage:settings'],
  DISPATCHER:        ['manage:trips', 'manage:drivers'],
  SAFETY_OFFICER:    ['manage:drivers', 'view:analytics'],
  FINANCIAL_ANALYST: ['view:finance', 'manage:finance', 'view:analytics'],
}

const modules = [
  { label: 'Dashboard',    permission: null as Permission | null },
  { label: 'Vehicles',     permission: 'manage:vehicles' as Permission },
  { label: 'Drivers',      permission: 'manage:drivers' as Permission },
  { label: 'Trips',        permission: 'manage:trips' as Permission },
  { label: 'Maintenance',  permission: 'manage:maintenance' as Permission },
  { label: 'Finance',      permission: 'view:finance' as Permission },
  { label: 'Analytics',    permission: 'view:analytics' as Permission },
  { label: 'Settings',     permission: 'manage:settings' as Permission },
]

const roles: Role[] = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']
const roleLabel: Record<Role, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

const roleBadgeColor: Record<Role, string> = {
  FLEET_MANAGER:     'bg-blue-500/20 text-blue-400',
  DISPATCHER:        'bg-green-500/20 text-green-400',
  SAFETY_OFFICER:    'bg-yellow-500/20 text-yellow-400',
  FINANCIAL_ANALYST: 'bg-purple-500/20 text-purple-400',
}

function can(role: Role, permission: Permission | null): boolean {
  if (!permission) return true // Dashboard is for all
  return rolePermissions[role]?.includes(permission) ?? false
}

function RoleChangeSelect({ user, currentUserRole, onRoleChange }: {
  user: User
  currentUserRole: Role
  onRoleChange: (userId: string, role: Role) => Promise<void>
}) {
  const [value, setValue] = useState<Role>(user.role)
  const [saving, setSaving] = useState(false)

  const handleChange = async (newRole: Role) => {
    setValue(newRole)
    setSaving(true)
    await onRoleChange(user.id, newRole)
    setSaving(false)
  }

  if (currentUserRole !== 'FLEET_MANAGER') {
    return <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${roleBadgeColor[value]}`}>{roleLabel[value]}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={e => handleChange(e.target.value as Role)}
        disabled={saving}
        className="w-auto min-w-[160px] text-sm py-1.5"
      >
        {roles.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
      </select>
      {saving && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const currentRole = (session?.user as any)?.role as Role | undefined
  const currentUserId = (session?.user as any)?.id as string | undefined

  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (currentRole === 'FLEET_MANAGER') {
      setUsersLoading(true)
      apiGet<User[]>('/users').then(({ data }) => {
        setUsers(data || [])
        setUsersLoading(false)
      })
    }
  }, [currentRole])

  const handleRoleChange = async (userId: string, role: Role) => {
    const { error } = await apiPatch(`/users/${userId}`, { role })
    if (error) {
      showToast('Failed to update role: ' + error, 'error')
    } else {
      showToast('Role updated successfully', 'success')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Platform configuration and administration</p>
      </div>

      {/* Section 1: App Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-5">Application Info</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Platform</p>
            <p className="text-slate-100 font-semibold text-lg">TransitOps</p>
            <p className="text-slate-400 text-sm">Smart Transport Platform</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Version</p>
            <p className="text-slate-100 font-semibold">1.0.0</p>
            <p className="text-slate-400 text-sm">Next.js 14 · Prisma · PostgreSQL</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Signed In As</p>
            <p className="text-slate-100 font-semibold">{session?.user?.name}</p>
            <p className="text-slate-400 text-sm">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Role</p>
            {currentRole && (
              <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${roleBadgeColor[currentRole]}`}>
                {roleLabel[currentRole]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: RBAC Matrix */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">Role-Based Access Control</h2>
          <p className="text-slate-400 text-sm mt-0.5">Module access by role (read-only)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                {roles.map(r => (
                  <th key={r} className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[r]}`}>
                      {roleLabel[r]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {modules.map(mod => (
                <tr key={mod.label} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-3 text-slate-200 font-medium">{mod.label}</td>
                  {roles.map(r => (
                    <td key={r} className="px-4 py-3 text-center">
                      {can(r, mod.permission)
                        ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        : <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: User Management (Fleet Manager only) */}
      {currentRole === 'FLEET_MANAGER' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-base font-semibold text-slate-100">User Management</h2>
            <p className="text-slate-400 text-sm mt-0.5">Manage team member roles</p>
          </div>
          {usersLoading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Name', 'Email', 'Role'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map(user => {
                    const isSelf = user.id === currentUserId
                    return (
                      <tr key={user.id} className={`hover:bg-slate-700/20 transition-colors ${isSelf ? 'bg-amber-500/5' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                              {user.name[0].toUpperCase()}
                            </div>
                            <span className="text-slate-200 font-medium">{user.name}</span>
                            {isSelf && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">You</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-400">{user.email}</td>
                        <td className="px-6 py-3">
                          {isSelf ? (
                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[user.role]}`}>
                              {roleLabel[user.role]}
                            </span>
                          ) : (
                            <RoleChangeSelect
                              user={user}
                              currentUserRole={currentRole}
                              onRoleChange={handleRoleChange}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
