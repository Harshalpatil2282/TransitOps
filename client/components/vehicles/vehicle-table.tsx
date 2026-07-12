'use client'
import { Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Vehicle } from '@/lib/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'

const typeBadge: Record<string, string> = {
  VAN:   'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  TRUCK: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  BUS:   'bg-green-500/20 text-green-400 border border-green-500/30',
  BIKE:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

interface VehicleTableProps {
  vehicles: Vehicle[]
  loading: boolean
  onEdit: (vehicle: Vehicle) => void
}

export function VehicleTable({ vehicles, loading, onEdit }: VehicleTableProps) {
  if (loading) return <TableSkeleton rows={7} cols={9} />

  if (!loading && vehicles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚛</span>
        </div>
        <p className="text-slate-300 font-medium">No vehicles found</p>
        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or add a new vehicle.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Reg No', 'Name', 'Type', 'Max Load', 'Odometer', 'Acq. Cost', 'Region', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {vehicles.map(v => (
            <tr key={v.id} className="hover:bg-slate-800/50 transition-colors group">
              <td className="px-4 py-3 font-mono text-amber-400 font-medium whitespace-nowrap">{v.regNo}</td>
              <td className="px-4 py-3 text-slate-200 font-medium">{v.name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[v.type] || ''}`}>
                  {v.type}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{v.maxLoadKg.toLocaleString()} kg</td>
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{v.odometer.toLocaleString()} km</td>
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">₹{v.acquisitionCost.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-slate-400">{v.region || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(v)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/fleet/vehicles/${v.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="View Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
