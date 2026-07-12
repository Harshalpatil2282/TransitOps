'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, X, Pencil, AlertTriangle } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { Driver } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { DriverForm } from '@/components/drivers/driver-form'
import { useToast } from '@/components/ui/toast'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function SafetyScore({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-semibold ${color}`}>{score}</span>
}

function ExpiryCell({ driver }: { driver: Driver }) {
  const date = new Date(driver.licenseExpiry).toLocaleDateString('en-IN')
  if (driver.isExpired) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-400 text-sm">{date}</span>
        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-medium">EXPIRED</span>
      </div>
    )
  }
  if (driver.expiringSoon) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-sm">{date}</span>
        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">Expiring Soon</span>
      </div>
    )
  }
  return <span className="text-slate-200 text-sm">{date}</span>
}

const categoryBadge: Record<string, string> = {
  LMV:  'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  HMV:  'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  HPMV: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

export default function DriversPage() {
  const { showToast } = useToast()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const { data } = await apiGet<Driver[]>(`/drivers?${params}`)
    setDrivers(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const filtered = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSuccess = (driver: Driver) => {
    setShowAdd(false)
    setEditDriver(null)
    fetchDrivers()
    showToast(editDriver ? `${driver.name} updated` : `${driver.name} added`, 'success')
  }

  const expiredCount = drivers.filter(d => d.isExpired).length
  const expiringSoonCount = drivers.filter(d => d.expiringSoon).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Driver Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {drivers.length} drivers
            {expiredCount > 0 && <span className="text-red-400 ml-2">· {expiredCount} license(s) expired</span>}
            {expiringSoonCount > 0 && <span className="text-amber-400 ml-2">· {expiringSoonCount} expiring soon</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {/* Alerts */}
      {expiredCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {expiredCount} driver(s) have expired licenses. They should not be dispatched.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 w-48"
          />
        </div>
        {(statusFilter || search) && (
          <button
            onClick={() => { setStatusFilter(''); setSearch('') }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors px-2"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={7} cols={7} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍✈️</span>
            </div>
            <p className="text-slate-300 font-medium">No drivers found</p>
            <p className="text-slate-500 text-sm mt-1">Add a driver or adjust filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Name', 'License No', 'Category', 'Expiry', 'Contact', 'Safety', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(driver => (
                  <tr key={driver.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-200">{driver.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">{driver.licenseNo}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge[driver.licenseCategory] || ''}`}>
                        {driver.licenseCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><ExpiryCell driver={driver} /></td>
                    <td className="px-4 py-3 text-slate-400">{driver.contact}</td>
                    <td className="px-4 py-3"><SafetyScore score={driver.safetyScore} /></td>
                    <td className="px-4 py-3"><StatusBadge status={driver.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditDriver(driver)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Driver" onClose={() => setShowAdd(false)}>
          <DriverForm onSuccess={handleSuccess} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editDriver && (
        <Modal title="Edit Driver" onClose={() => setEditDriver(null)}>
          <DriverForm driver={editDriver} onSuccess={handleSuccess} onClose={() => setEditDriver(null)} />
        </Modal>
      )}
    </div>
  )
}
