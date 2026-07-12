'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertTriangle, Wrench, CheckCircle, Clock } from 'lucide-react'
import { apiGet, apiPatch } from '@/lib/api'
import { MaintenanceLog } from '@/lib/types'
import { MaintenanceForm } from '@/components/maintenance/maintenance-form'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [closing, setClosing] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const { data, error: err } = await apiGet<MaintenanceLog[]>(`/maintenance?${params}`)
    if (err) setError(err)
    else setLogs(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleCloseLog = async (id: string) => {
    setClosing(id)
    await apiPatch(`/maintenance/${id}`, { status: 'CLOSED' })
    setClosing(null)
    fetchLogs()
  }

  const activeCount = logs.filter(l => l.status === 'ACTIVE').length
  const closedCount = logs.filter(l => l.status === 'CLOSED').length
  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Maintenance Logs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading...' : `${logs.length} record${logs.length !== 1 ? 's' : ''}`}
            {activeCount > 0 && <span className="text-amber-400 ml-2">· {activeCount} active</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} disabled={loading} className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={fetchLogs} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">{activeCount}</div>
            <div className="text-sm text-slate-400">Active</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">{closedCount}</div>
            <div className="text-sm text-slate-400">Closed</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">₹{totalCost.toLocaleString('en-IN')}</div>
            <div className="text-sm text-slate-400">Total Cost</div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {(['', 'ACTIVE', 'CLOSED'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold">No maintenance records</p>
            <p className="text-slate-500 text-sm mt-1">Click "Add Record" to log maintenance work.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/80">
                  {['Vehicle', 'Service Type', 'Date', 'Cost (₹)', 'Status', 'Notes', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className="text-amber-400 font-semibold text-sm font-mono">
                        {(log as any).vehicle?.regNo ?? log.vehicleId.slice(0, 8)}
                      </span>
                      {(log as any).vehicle?.name && (
                        <p className="text-slate-400 text-xs mt-0.5">{(log as any).vehicle.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-100 font-medium">{log.serviceType}</td>
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 tabular-nums">
                      ₹{log.cost.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-[200px] truncate">
                      {log.notes || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {log.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCloseLog(log.id)}
                          disabled={closing === log.id}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {closing === log.id ? 'Closing…' : 'Mark Closed'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-700/50 text-xs text-slate-500">
              Showing {logs.length} record{logs.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {showForm && <MaintenanceForm onClose={() => setShowForm(false)} onSave={fetchLogs} />}
    </div>
  )
}
