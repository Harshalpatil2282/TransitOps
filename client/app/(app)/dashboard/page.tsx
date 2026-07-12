'use client'
import { useEffect, useState } from 'react'
import { Truck, MapPin, Users, Activity, TrendingUp, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { DashboardData } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string; icon: any; color: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-black/20 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100 mb-1 tabular-nums">{value}</div>
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data: result, error: err } = await apiGet<DashboardData>('/dashboard')
    if (err) setError(err)
    else setData(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const name = session?.user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{greeting}, {name} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s what&apos;s happening with your fleet today.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load dashboard data: {error}. Make sure the backend server is running at localhost:3000.
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Active Vehicles" value={data.kpis.activeVehicles} subtitle="Currently on trip" icon={Truck} color="bg-blue-500" />
          <KPICard title="Available" value={data.kpis.availableVehicles} subtitle="Ready to dispatch" icon={CheckCircle} color="bg-green-500" />
          <KPICard title="In Maintenance" value={data.kpis.inMaintenance} subtitle="In shop" icon={AlertTriangle} color="bg-amber-500" />
          <KPICard title="Active Trips" value={data.kpis.activeTrips} subtitle="Dispatched" icon={MapPin} color="bg-purple-500" />
          <KPICard title="Pending Trips" value={data.kpis.pendingTrips} subtitle="Draft status" icon={Clock} color="bg-slate-600" />
          <KPICard title="Drivers On Duty" value={data.kpis.driversOnDuty} subtitle="Currently active" icon={Users} color="bg-cyan-500" />
          <KPICard title="Fleet Utilization" value={`${data.kpis.fleetUtilization}%`} subtitle="Of active fleet" icon={Activity} color="bg-rose-500" />
          <KPICard title="Total Fleet" value={data.kpis.totalVehicles} subtitle="Non-retired vehicles" icon={TrendingUp} color="bg-indigo-500" />
        </div>
      ) : null}

      {/* Bottom row */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Fleet Status Breakdown</h2>
            <div className="space-y-3">
              {data.vehicleStatusBreakdown.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <StatusBadge status={status} />
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${data.kpis.totalVehicles ? (count / (data.kpis.totalVehicles + data.vehicleStatusBreakdown.find(s => s.status === 'RETIRED')!.count)) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-slate-100 font-semibold text-sm w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trips */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Recent Trips</h2>
              <span className="text-xs text-slate-500">{data.recentTrips.length} trips</span>
            </div>
            {data.recentTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-slate-400 text-sm">No trips yet. Start by dispatching a vehicle.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {data.recentTrips.map(trip => (
                  <div key={trip.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-700/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">
                        <span className="text-amber-400">{trip.source}</span>
                        <span className="text-slate-500 mx-2">→</span>
                        <span>{trip.destination}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {trip.vehicle?.name || 'Unknown vehicle'} · {trip.driver?.name || 'Unknown driver'}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(trip.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
