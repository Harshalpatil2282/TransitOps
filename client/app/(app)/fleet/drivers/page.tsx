'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, X, Pencil, RefreshCw, AlertTriangle, Users, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { apiGet, apiPost, apiPatch } from '@/lib/api'
import { Driver } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Driver Form ──────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, 'Full name is required'),
  licenseNo: z.string().min(1, 'License number is required'),
  licenseCategory: z.enum(['LMV', 'HMV', 'HPMV']),
  licenseExpiry: z.string().min(1, 'Expiry date is required'),
  contact: z.string().min(10, 'Enter a valid contact number'),
  safetyScore: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100').default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
})
type FormValues = {
  name: string; licenseNo: string; licenseCategory: 'LMV' | 'HMV' | 'HPMV'
  licenseExpiry: string; contact: string; safetyScore: number
  status?: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
}

function DriverForm({ driver, onSuccess, onClose }: { driver?: Driver; onSuccess: (d: Driver) => void; onClose: () => void }) {
  const isEdit = !!driver
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: driver ? {
      name: driver.name,
      licenseNo: driver.licenseNo,
      licenseCategory: driver.licenseCategory as 'LMV' | 'HMV' | 'HPMV',
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
      contact: driver.contact,
      safetyScore: driver.safetyScore,
      status: driver.status,
    } : { safetyScore: 100, licenseCategory: 'LMV' },
  })

  const onSubmit = async (data: FormValues) => {
    const result = isEdit
      ? await apiPatch<Driver>(`/drivers/${driver!.id}`, data)
      : await apiPost<Driver>('/drivers', data)
    if (result.error) {
      if (result.status === 409) setError('licenseNo', { message: 'License number already registered' })
      else setError('root', { message: result.error })
      return
    }
    onSuccess(result.data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {(errors as any).root && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {(errors as any).root.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
          <input {...register('name')} placeholder="Rajesh Kumar" className={`w-full ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact Number *</label>
          <input {...register('contact')} placeholder="+91 98765 43210" className={`w-full ${errors.contact ? 'border-red-500' : ''}`} />
          {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">License No *</label>
          <input {...register('licenseNo')} placeholder="MH0120230012345" readOnly={isEdit}
            className={`w-full font-mono text-sm ${errors.licenseNo ? 'border-red-500' : ''} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
          {errors.licenseNo && <p className="text-red-400 text-xs mt-1">{errors.licenseNo.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
          <select {...register('licenseCategory')} className={`w-full ${errors.licenseCategory ? 'border-red-500' : ''}`}>
            <option value="LMV">LMV — Light Motor Vehicle</option>
            <option value="HMV">HMV — Heavy Motor Vehicle</option>
            <option value="HPMV">HPMV — Heavy Passenger MV</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">License Expiry *</label>
          <input {...register('licenseExpiry')} type="date" className={`w-full ${errors.licenseExpiry ? 'border-red-500' : ''}`} />
          {errors.licenseExpiry && <p className="text-red-400 text-xs mt-1">{errors.licenseExpiry.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Safety Score <span className="text-slate-500 font-normal">(0–100)</span>
          </label>
          <input {...register('safetyScore')} type="number" min="0" max="100" placeholder="100" className="w-full" />
          {errors.safetyScore && <p className="text-red-400 text-xs mt-1">{errors.safetyScore.message}</p>}
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
          <select {...register('status')} className="w-full">
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Driver'}
        </button>
      </div>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const categoryBadge: Record<string, string> = {
  LMV: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  HMV: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  HPMV: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

function SafetyScore({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
  const bg = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${bg} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-semibold text-sm tabular-nums ${color}`}>{score}</span>
    </div>
  )
}

function ExpiryCell({ driver }: { driver: Driver }) {
  const date = new Date(driver.licenseExpiry).toLocaleDateString('en-IN')
  if (driver.isExpired) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-red-400 text-sm">{date}</span>
        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-semibold">EXPIRED</span>
      </div>
    )
  }
  if (driver.expiringSoon) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-amber-400 text-sm">{date}</span>
        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">Soon</span>
      </div>
    )
  }
  return <span className="text-slate-300 text-sm">{date}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DriversPage() {
  const { showToast } = useToast()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const { data, error: err } = await apiGet<Driver[]>(`/drivers?${params}`)
    if (err) setError(err)
    else setDrivers(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const filtered = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.licenseNo.toLowerCase().includes(search.toLowerCase())
  )

  const expiredCount = drivers.filter(d => d.isExpired).length
  const expiringSoonCount = drivers.filter(d => d.expiringSoon && !d.isExpired).length

  const handleSuccess = (driver: Driver) => {
    setShowAdd(false)
    setEditDriver(null)
    fetchDrivers()
    showToast(editDriver ? `${driver.name} updated` : `${driver.name} added`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Driver Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading...' : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''}`}
            {expiredCount > 0 && <span className="text-red-400 ml-2">· {expiredCount} expired</span>}
            {expiringSoonCount > 0 && <span className="text-amber-400 ml-2">· {expiringSoonCount} expiring soon</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDrivers} disabled={loading} className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={fetchDrivers} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* License alerts */}
      {expiredCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-5 py-4 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
          <div>
            <span className="font-semibold">{expiredCount} driver{expiredCount > 1 ? 's have' : ' has'} an expired license.</span>
            <span className="text-red-400 ml-1">They cannot be assigned to trips until renewed.</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider self-center">Filter:</span>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto min-w-[145px] py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or license..." className="pl-8 w-48 py-1.5 text-sm" />
        </div>
        {(statusFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setSearch('') }} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={7} cols={8} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold">No drivers found</p>
            <p className="text-slate-500 text-sm mt-1">
              {statusFilter || search ? 'Try adjusting your filters.' : 'Click "Add Driver" to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  {['Name', 'License No', 'Category', 'Expiry', 'Contact', 'Safety Score', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(driver => (
                  <tr key={driver.id} className={`hover:bg-slate-700/30 transition-colors group ${driver.isExpired ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold flex-shrink-0">
                          {driver.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-slate-100 font-medium">{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-xs">{driver.licenseNo}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge[driver.licenseCategory]}`}>
                        {driver.licenseCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><ExpiryCell driver={driver} /></td>
                    <td className="px-4 py-3.5 text-slate-400">{driver.contact}</td>
                    <td className="px-4 py-3.5"><SafetyScore score={driver.safetyScore} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={driver.status} /></td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => setEditDriver(driver)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-700/50 text-xs text-slate-500">
              Showing {filtered.length} of {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add New Driver" onClose={() => setShowAdd(false)}>
          <DriverForm onSuccess={handleSuccess} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editDriver && (
        <Modal title={`Edit — ${editDriver.name}`} onClose={() => setEditDriver(null)}>
          <DriverForm driver={editDriver} onSuccess={handleSuccess} onClose={() => setEditDriver(null)} />
        </Modal>
      )}
    </div>
  )
}
