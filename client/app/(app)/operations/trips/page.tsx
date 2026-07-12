'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertTriangle, MapPin } from 'lucide-react'
import { apiGet, apiPatch } from '@/lib/api'
import { Trip } from '@/lib/types'
import { TripCard } from '@/components/trips/trip-card'
import { TripDetail } from '@/components/trips/trip-detail'
import { CreateTripDialog } from '@/components/trips/create-trip-dialog'
import { TableSkeleton } from '@/components/ui/skeleton'

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const { data, error: err } = await apiGet<Trip[]>(`/trips?${params}`)
    if (err) setError(err)
    else setTrips(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const selectedTrip = trips.find(t => t.id === selectedId)

  const handleAction = async (action: string, data?: any) => {
    if (!selectedId) return
    setActionLoading(true)
    setActionError(null)

    const body: Record<string, any> = {}
    if (action === 'dispatch') body.status = 'DISPATCHED'
    else if (action === 'cancel') body.status = 'CANCELLED'
    else if (action === 'complete') {
      body.status = 'COMPLETED'
      body.actualOdometer = data.actualOdometer
      body.fuelConsumed = data.fuelConsumed
    }

    const result = await apiPatch<Trip>(`/trips/${selectedId}`, body)
    setActionLoading(false)
    if (result.error) {
      setActionError(result.error)
    } else {
      await fetchTrips()
      setSelectedId(null)
    }
  }

  const statusCounts = {
    DRAFT: trips.filter(t => t.status === 'DRAFT').length,
    DISPATCHED: trips.filter(t => t.status === 'DISPATCHED').length,
    COMPLETED: trips.filter(t => t.status === 'COMPLETED').length,
    CANCELLED: trips.filter(t => t.status === 'CANCELLED').length,
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Trip Operations</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading...' : `${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
            {statusCounts.DISPATCHED > 0 && <span className="text-green-400 ml-2">· {statusCounts.DISPATCHED} active</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTrips} disabled={loading} className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm">
            <Plus className="w-4 h-4" /> Create Trip
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={fetchTrips} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        {(['', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}>
            {s === '' ? `All (${trips.length})` : `${s} (${statusCounts[s]})`}
          </button>
        ))}
      </div>

      {/* Main content: list + detail */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Trip list */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          {loading ? (
            <TableSkeleton rows={5} cols={1} />
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-xl border border-slate-700">
              <MapPin className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No trips found</p>
              <p className="text-slate-500 text-xs mt-1">Click "Create Trip" to get started</p>
            </div>
          ) : (
            trips.map(trip => (
              <TripCard key={trip.id} trip={trip as any} isSelected={selectedId === trip.id} onClick={() => {
                setSelectedId(trip.id === selectedId ? null : trip.id)
                setActionError(null)
              }} />
            ))
          )}
        </div>

        {/* Trip detail panel */}
        <div className="flex-1 min-w-0">
          {selectedTrip ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 h-full overflow-y-auto">
              <TripDetail
                trip={selectedTrip as any}
                onAction={handleAction}
                actionLoading={actionLoading}
                error={actionError}
              />
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 border-dashed rounded-xl h-full flex flex-col items-center justify-center text-center p-8">
              <MapPin className="w-10 h-10 text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">Select a trip</p>
              <p className="text-slate-500 text-sm mt-1">Click a trip card to view details and take actions</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateTripDialog onClose={() => setShowCreate(false)} onSave={fetchTrips} />}
    </div>
  )
}
