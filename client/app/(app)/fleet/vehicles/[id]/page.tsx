'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Truck, Wrench, Fuel } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { VehicleDetail, MaintenanceLog, FuelLog } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { Skeleton } from '@/components/ui/skeleton'

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  )
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'maintenance' | 'fuel'>('maintenance')

  useEffect(() => {
    apiGet<VehicleDetail>(`/vehicles/${id}`).then(({ data }) => {
      setVehicle(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2"><Skeleton className="h-64" /></div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return <div className="text-center py-16 text-slate-400">Vehicle not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push('/fleet/vehicles')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vehicles
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{vehicle.name}</h1>
            <p className="text-slate-400 text-sm font-mono">{vehicle.regNo}</p>
          </div>
          <div className="ml-auto"><StatusBadge status={vehicle.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle info card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Vehicle Info</h2>
          <InfoRow label="Type" value={vehicle.type} />
          <InfoRow label="Max Load" value={`${vehicle.maxLoadKg.toLocaleString()} kg`} />
          <InfoRow label="Odometer" value={`${vehicle.odometer.toLocaleString()} km`} />
          <InfoRow label="Acq. Cost" value={`₹${vehicle.acquisitionCost.toLocaleString('en-IN')}`} />
          <InfoRow label="Region" value={vehicle.region || '—'} />
          <InfoRow label="Total Trips" value={vehicle.trips?.length ?? 0} />
          <InfoRow label="Added" value={new Date(vehicle.createdAt).toLocaleDateString('en-IN')} />
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-slate-700">
            {(['maintenance', 'fuel'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'maintenance' ? <Wrench className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
                {t === 'maintenance' ? 'Maintenance History' : 'Fuel Logs'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="overflow-auto max-h-[400px]">
            {tab === 'maintenance' ? (
              vehicle.maintenanceLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No maintenance records</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                    <tr>
                      {['Service Type', 'Date', 'Cost', 'Status', 'Notes'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {vehicle.maintenanceLogs.map((log: MaintenanceLog) => (
                      <tr key={log.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-200">{log.serviceType}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(log.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-200">₹{log.cost.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                        <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{log.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              vehicle.fuelLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No fuel records</div>
              ) : (
                <>
                  <div className="px-5 py-3 bg-slate-750 border-b border-slate-700 flex gap-6">
                    <div>
                      <p className="text-xs text-slate-400">Total Fuel</p>
                      <p className="text-sm font-semibold text-slate-200">
                        {vehicle.fuelLogs.reduce((s: number, f: FuelLog) => s + f.liters, 0).toFixed(1)} L
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Total Cost</p>
                      <p className="text-sm font-semibold text-slate-200">
                        ₹{vehicle.fuelLogs.reduce((s: number, f: FuelLog) => s + f.cost, 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                      <tr>
                        {['Date', 'Liters', 'Cost', 'Per Liter'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {vehicle.fuelLogs.map((log: FuelLog) => (
                        <tr key={log.id} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3 text-slate-400">{new Date(log.date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 text-slate-200">{log.liters} L</td>
                          <td className="px-4 py-3 text-slate-200">₹{log.cost.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-slate-400">₹{(log.cost / log.liters).toFixed(2)}/L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
