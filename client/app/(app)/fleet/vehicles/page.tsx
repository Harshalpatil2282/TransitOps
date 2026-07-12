'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, X, Pencil, Eye, RefreshCw, AlertTriangle, Truck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { apiGet, apiPost, apiPatch } from '@/lib/api'
import { Vehicle } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

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
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
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

// ─── Vehicle Form ─────────────────────────────────────────────────────────────
const schema = z.object({
  regNo: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Vehicle name is required'),
  type: z.enum(['VAN', 'TRUCK', 'BUS', 'BIKE']),
  maxLoadKg: z.coerce.number().positive('Must be greater than 0'),
  acquisitionCost: z.coerce.number().positive('Must be greater than 0'),
  odometer: z.coerce.number().min(0, 'Cannot be negative').default(0),
  region: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
})
type FormValues = {
  regNo: string; name: string; type: 'VAN' | 'TRUCK' | 'BUS' | 'BIKE'
  maxLoadKg: number; acquisitionCost: number; odometer: number
  region?: string; status?: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
}

function VehicleForm({ vehicle, onSuccess, onClose }: { vehicle?: Vehicle; onSuccess: (v: Vehicle) => void; onClose: () => void }) {
  const isEdit = !!vehicle
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: vehicle ? {
      regNo: vehicle.regNo, name: vehicle.name, type: vehicle.type,
      maxLoadKg: vehicle.maxLoadKg, acquisitionCost: vehicle.acquisitionCost,
      odometer: vehicle.odometer, region: vehicle.region || '', status: vehicle.status,
    } : { type: 'VAN', odometer: 0 },
  })

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, regNo: data.regNo.trim().toUpperCase() }
    const result = isEdit
      ? await apiPatch<Vehicle>(`/vehicles/${vehicle!.id}`, payload)
      : await apiPost<Vehicle>('/vehicles', payload)
    if (result.error) {
      if (result.status === 409) setError('regNo', { message: 'Registration number already exists' })
      else setError('root', { message: result.error })
      return
    }
    onSuccess(result.data)
  }

  const field = (label: string, name: keyof FormValues, opts?: { type?: string; placeholder?: string; disabled?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input {...register(name as any)} type={opts?.type || 'text'} placeholder={opts?.placeholder}
        disabled={opts?.disabled} className={`w-full ${errors[name] ? 'border-red-500 focus:border-red-500' : ''} ${opts?.disabled ? 'opacity-60 cursor-not-allowed' : ''}`} />
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]?.message as string}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      {(errors as any).root && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {(errors as any).root.message}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {field('Registration No *', 'regNo', { placeholder: 'MH12AB1234', disabled: isEdit })}
        {field('Vehicle Name *', 'name', { placeholder: 'Tata Ace Gold' })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Type *</label>
          <select {...register('type')} className="w-full">
            <option value="VAN">🚐 Van</option>
            <option value="TRUCK">🚚 Truck</option>
            <option value="BUS">🚌 Bus</option>
            <option value="BIKE">🏍️ Bike</option>
          </select>
        </div>
        {field('Max Load (kg) *', 'maxLoadKg', { type: 'number', placeholder: '1000' })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Acquisition Cost (₹) *', 'acquisitionCost', { type: 'number', placeholder: '500000' })}
        {field('Odometer (km)', 'odometer', { type: 'number', placeholder: '0' })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Region', 'region', { placeholder: 'Mumbai' })}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <select {...register('status')} className="w-full">
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────
const typeBadge: Record<string, string> = {
  VAN: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  TRUCK: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  BUS: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BIKE: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VehiclesPage() {
  const { showToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (regionFilter) params.set('region', regionFilter)
    const { data, error: err } = await apiGet<Vehicle[]>(`/vehicles?${params}`)
    if (err) setError(err)
    else setVehicles(data || [])
    setLoading(false)
  }, [typeFilter, statusFilter, regionFilter])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleSuccess = (vehicle: Vehicle) => {
    setShowAdd(false)
    setEditVehicle(null)
    fetchVehicles()
    showToast(editVehicle ? `${vehicle.name} updated successfully` : `${vehicle.name} added to fleet`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vehicle Registry</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading...' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in fleet`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVehicles} disabled={loading} className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={fetchVehicles} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Filter:</span>
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-auto min-w-[130px] py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="VAN">Van</option>
          <option value="TRUCK">Truck</option>
          <option value="BUS">Bus</option>
          <option value="BIKE">Bike</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto min-w-[145px] py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input value={regionFilter} onChange={e => setRegionFilter(e.target.value)} placeholder="Region..." className="pl-8 w-40 py-1.5 text-sm" />
        </div>
        {(typeFilter || statusFilter || regionFilter) && (
          <button onClick={() => { setTypeFilter(''); setStatusFilter(''); setRegionFilter('') }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold">No vehicles found</p>
            <p className="text-slate-500 text-sm mt-1">
              {typeFilter || statusFilter || regionFilter ? 'Try adjusting your filters.' : 'Click "Add Vehicle" to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  {['Reg No', 'Name', 'Type', 'Max Load', 'Odometer', 'Acq. Cost', 'Region', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-4 py-3.5 font-mono text-amber-400 font-semibold text-sm whitespace-nowrap">{v.regNo}</td>
                    <td className="px-4 py-3.5 text-slate-100 font-medium">{v.name}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[v.type]}`}>{v.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap tabular-nums">{v.maxLoadKg.toLocaleString()} kg</td>
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap tabular-nums">{v.odometer.toLocaleString()} km</td>
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap tabular-nums">₹{v.acquisitionCost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 text-slate-400">{v.region || <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditVehicle(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit vehicle">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/fleet/vehicles/${v.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View details">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-700/50 text-xs text-slate-500">
              Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <Modal title="Add New Vehicle" onClose={() => setShowAdd(false)}>
          <VehicleForm onSuccess={handleSuccess} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editVehicle && (
        <Modal title={`Edit — ${editVehicle.name}`} onClose={() => setEditVehicle(null)}>
          <VehicleForm vehicle={editVehicle} onSuccess={handleSuccess} onClose={() => setEditVehicle(null)} />
        </Modal>
      )}
    </div>
  )
}
