'use client'

import { StatusBadge } from '@/components/ui/status-badge'

interface Trip {
  id: string
  source: string
  destination: string
  vehicle: { regNo: string }
  driver: { name: string }
  status: string
}

interface TripCardProps {
  trip: Trip
  isSelected: boolean
  onClick: () => void
}

export function TripCard({ trip, isSelected, onClick }: TripCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-amber-500 bg-amber-500/5'
          : 'border border-slate-700 hover:border-amber-500/50 bg-slate-800/60 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-slate-500">{trip.id.slice(0, 8)}…</span>
        <StatusBadge status={trip.status} />
      </div>
      <div className="text-slate-100 font-medium mb-2 text-sm">
        <span className="text-amber-400">{trip.source}</span>
        <span className="text-slate-500 mx-2">→</span>
        {trip.destination}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{trip.vehicle?.regNo ?? '—'}</span>
        <span>{trip.driver?.name ?? '—'}</span>
      </div>
    </div>
  )
}
