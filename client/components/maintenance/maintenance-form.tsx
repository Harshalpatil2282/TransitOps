'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { Vehicle } from '@/lib/types'

interface MaintenanceFormProps {
  onClose: () => void
  onSave: () => void
}

export function MaintenanceForm({ onClose, onSave }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    vehicleId: '',
    serviceType: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error: err } = await apiGet<Vehicle[]>('/vehicles')
      if (!err) setVehicles((data || []).filter(v => v.status !== 'RETIRED'))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId)
  const isAlreadyInShop = selectedVehicle?.status === 'IN_SHOP'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await apiPost<any>('/maintenance', {
      ...form,
      cost: Number(form.cost),
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
          <h2 className="text-base font-semibold text-slate-100">Add Maintenance Record</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle *</label>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading vehicles...
              </div>
            ) : (
              <select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="w-full" required>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.regNo} — {v.name} ({v.status})</option>
                ))}
              </select>
            )}
            {isAlreadyInShop && (
              <div className="flex items-center gap-1.5 mt-2 text-amber-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vehicle is already In Shop. A new record will be added.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Service Type *</label>
            <input type="text" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}
              className="w-full" placeholder="Oil Change, Tyre Replace, Engine Repair..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cost (₹) *</label>
              <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                className="w-full" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full" rows={3} placeholder="Additional notes..." />
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
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
