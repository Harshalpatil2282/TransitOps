import React from 'react'

type Status =
  | 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
  | 'SUSPENDED' | 'OFF_DUTY'
  | 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  | 'ACTIVE' | 'CLOSED'

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE:  { label: 'Available',  className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  ON_TRIP:    { label: 'On Trip',    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  IN_SHOP:    { label: 'In Shop',    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  RETIRED:    { label: 'Retired',    className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
  SUSPENDED:  { label: 'Suspended',  className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  OFF_DUTY:   { label: 'Off Duty',   className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
  DRAFT:      { label: 'Draft',      className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
  DISPATCHED: { label: 'Dispatched', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  COMPLETED:  { label: 'Completed',  className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  ACTIVE:     { label: 'Active',     className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  CLOSED:     { label: 'Closed',     className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}
