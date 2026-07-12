'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { Vehicle } from '@/lib/types'
import { VehicleTable } from '@/components/vehicles/vehicle-table'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
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

export default function VehiclesPage() {
  const { showToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (regionFilter) params.set('region', regionFilter)
    const { data } = await apiGet<Vehicle[]>(`/vehicles?${params}`)
    setVehicles(data || [])
    setLoading(false)
  }, [typeFilter, statusFilter, regionFilter])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleSuccess = (vehicle: Vehicle) => {
    setShowAdd(false)
    setEditVehicle(null)
    fetchVehicles()
    showToast(editVehicle ? `${vehicle.name} updated` : `${vehicle.name} added`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vehicle Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your fleet assets</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-auto min-w-[140px]"
        >
          <option value="">All Types</option>
          <option value="VAN">Van</option>
          <option value="TRUCK">Truck</option>
          <option value="BUS">Bus</option>
          <option value="BIKE">Bike</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-auto min-w-[150px]"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            placeholder="Filter by region..."
            className="pl-9 w-48"
          />
        </div>
        {(typeFilter || statusFilter || regionFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setRegionFilter('') }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors px-2"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <VehicleTable vehicles={vehicles} loading={loading} onEdit={setEditVehicle} />
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Vehicle" onClose={() => setShowAdd(false)}>
          <VehicleForm onSuccess={handleSuccess} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editVehicle && (
        <Modal title="Edit Vehicle" onClose={() => setEditVehicle(null)}>
          <VehicleForm vehicle={editVehicle} onSuccess={handleSuccess} onClose={() => setEditVehicle(null)} />
        </Modal>
      )}
    </div>
  )
}
