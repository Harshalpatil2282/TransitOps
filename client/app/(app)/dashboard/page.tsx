'use client'
import { useEffect, useState } from 'react'
import { Truck, MapPin, Users, Activity, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { DashboardData } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<DashboardData>('/dashboard').then(({ data }) => {
      setData(data)
      setLoading(false)
    })
  }, [])

  const name = session?.user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{greeting}, {name} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening with your fleet today.</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Active Vehicles" value={data?.kpis.activeVehicles ?? 0} subtitle="On Trip" icon={Truck} color="bg-blue-500" />
          <KPICard title="Available" value={data?.kpis.availableVehicles ?? 0} subtitle="Ready to dispatch" icon={CheckCircle} color="bg-green-500" />
          <KPICard title="In Maintenance" value={data?.kpis.inMaintenance ?? 0} subtitle="In shop" icon={AlertTriangle} color="bg-amber-500" />
          <KPICard title="Active Trips" value={data?.kpis.activeTrips ?? 0} subtitle="Dispatched" icon={MapPin} color="bg-purple-500" />
          <KPICard title="Pending Trips" value={data?.kpis.pendingTrips ?? 0} subtitle="Draft status" icon={Clock} color="bg-slate-600" />
          <KPICard title="Drivers On Duty" value={data?.kpis.driversOnDuty ?? 0} subtitle="Currently active" icon={Users} color="bg-cyan-500" />
          <KPICard title="Fleet Utilization" value={`${data?.kpis.fleetUtilization ?? 0}%`} subtitle="Of active fleet" icon={Activity} color="bg-rose-500" />
          <KPICard title="Total Fleet" value={data?.kpis.totalVehicles ?? 0} subtitle="Non-retired" icon={TrendingUp} color="bg-indigo-500" />
        </div>
      )}

      {/* Status Breakdown + Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Fleet Status</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-slate-700 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-slate-700 rounded w-8 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.vehicleStatusBreakdown.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-slate-100 font-semibold text-sm">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-base font-semibold text-slate-100">Recent Trips</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : (
            <div className="divide-y divide-slate-700/50">
              {data?.recentTrips.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">No trips yet</div>
              )}
              {data?.recentTrips.map(trip => (
                <div key={trip.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-700/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{trip.source} → {trip.destination}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{trip.vehicle?.name} · {trip.driver?.name}</p>
                  </div>
                  <StatusBadge status={trip.status} />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
