'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Loader2, X } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { Vehicle, Driver } from '@/lib/types'

interface CreateTripDialogProps {
  onClose: () => void
  onSave: () => void
}

export function CreateTripDialog({ onClose, onSave }: CreateTripDialogProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeightKg: '',
    plannedDistanceKm: '',
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [vehiclesRes, driversRes] = await Promise.all([
        apiGet<Vehicle[]>('/vehicles?status=AVAILABLE'),
        apiGet<Driver[]>('/drivers?status=AVAILABLE'),
      ])
      if (!vehiclesRes.error) setVehicles(vehiclesRes.data || [])
      if (!driversRes.error) setDrivers(driversRes.data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId)
  const selectedDriver = drivers.find(d => d.id === form.driverId)
  const cargoWeight = Number(form.cargoWeightKg)
  const exceedsCapacity = selectedVehicle && cargoWeight > selectedVehicle.maxLoadKg
  const withinCapacity = selectedVehicle && cargoWeight > 0 && cargoWeight <= selectedVehicle.maxLoadKg
  const isDriverExpiringSoon = selectedDriver
    ? new Date(selectedDriver.licenseExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await apiPost<any>('/trips', {
      source: form.source,
      destination: form.destination,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      cargoWeightKg: Number(form.cargoWeightKg),
      plannedDistanceKm: Number(form.plannedDistanceKm),
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSave()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-100">Create Trip</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Source *</label>
              <input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                placeholder="Mumbai" className="w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Destination *</label>
              <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
                placeholder="Pune" className="w-full" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle *</label>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading vehicles...</div>
            ) : (
              <select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="w-full" required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.regNo} — {v.name} ({v.maxLoadKg}kg max)</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Driver *</label>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading drivers...</div>
            ) : (
              <select value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })} className="w-full" required>
                <option value="">Select driver...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.licenseCategory} (exp: {new Date(d.licenseExpiry).toLocaleDateString('en-IN')})
                    {isDriverExpiringSoon && d.id === form.driverId ? ' ⚠' : ''}
                  </option>
                ))}
              </select>
            )}
            {isDriverExpiringSoon && form.driverId && (
              <p className="text-amber-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> License expiring soon</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cargo Weight (kg) *</label>
              <input type="number" value={form.cargoWeightKg} onChange={e => setForm({ ...form, cargoWeightKg: e.target.value })}
                className="w-full" min="0" step="0.1" required />
              {selectedVehicle && <p className="text-xs text-slate-500 mt-1">Max: {selectedVehicle.maxLoadKg} kg</p>}
              {exceedsCapacity && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3" /> Exceeds vehicle capacity!
                </div>
              )}
              {withinCapacity && (
                <div className="flex items-center gap-1.5 mt-1.5 text-green-400 text-xs">
                  <CheckCircle className="w-3 h-3" /> Within capacity ({cargoWeight}/{selectedVehicle!.maxLoadKg} kg)
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Planned Distance (km) *</label>
              <input type="number" value={form.plannedDistanceKm} onChange={e => setForm({ ...form, plannedDistanceKm: e.target.value })}
                className="w-full" min="0" step="0.1" required />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !!exceedsCapacity}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
