'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TripFull {
  id: string
  source: string
  destination: string
  vehicle: { regNo: string; name: string }
  driver: { name: string }
  cargoWeightKg: number
  plannedDistanceKm: number
  status: string
  createdAt: string
  actualOdometer?: number
  fuelConsumed?: number
}

interface TripDetailProps {
  trip: TripFull
  onAction: (action: string, data?: any) => void
  actionLoading: boolean
  error: string | null
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-100">{value}</p>
    </div>
  )
}

export function TripDetail({ trip, onAction, actionLoading, error }: TripDetailProps) {
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [actualOdometer, setActualOdometer] = useState('')
  const [fuelConsumed, setFuelConsumed] = useState('')

  const steps = ['DRAFT', 'DISPATCHED', 'COMPLETED']
  const currentStepIndex = steps.indexOf(trip.status)
  const isCancelled = trip.status === 'CANCELLED'

  const handleComplete = () => {
    onAction('complete', {
      actualOdometer: Number(actualOdometer),
      fuelConsumed: Number(fuelConsumed),
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs text-slate-500">{trip.id}</span>
            <StatusBadge status={trip.status} />
          </div>
          <p className="text-xs text-slate-500">Created: {new Date(trip.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                index <= currentStepIndex ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-500'
              }`}>
                {index <= currentStepIndex ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-xs font-medium ${index <= currentStepIndex ? 'text-slate-100' : 'text-slate-500'}`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-amber-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2 mb-8 text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Trip Cancelled</span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <DetailRow label="Source" value={trip.source} />
        <DetailRow label="Destination" value={trip.destination} />
        <DetailRow label="Vehicle" value={`${trip.vehicle.regNo} — ${trip.vehicle.name}`} />
        <DetailRow label="Driver" value={trip.driver.name} />
        <DetailRow label="Cargo Weight" value={`${trip.cargoWeightKg} kg`} />
        <DetailRow label="Planned Distance" value={`${trip.plannedDistanceKm} km`} />
        {trip.actualOdometer && <DetailRow label="Actual Odometer" value={`${trip.actualOdometer} km`} />}
        {trip.fuelConsumed && <DetailRow label="Fuel Consumed" value={`${trip.fuelConsumed} L`} />}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      {trip.status === 'DRAFT' && (
        <div className="space-y-2">
          <button onClick={() => onAction('dispatch')} disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Dispatch Trip
          </button>
          <button onClick={() => onAction('cancel')} disabled={actionLoading}
            className="w-full border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            Cancel Trip
          </button>
        </div>
      )}

      {trip.status === 'DISPATCHED' && (
        <div className="space-y-2">
          {!showCompleteForm ? (
            <>
              <button onClick={() => setShowCompleteForm(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
                Complete Trip
              </button>
              <button onClick={() => onAction('cancel')} disabled={actionLoading}
                className="w-full border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
                Cancel Trip
              </button>
            </>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Complete Trip Details</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Actual Odometer (km)</label>
                <input type="number" value={actualOdometer} onChange={e => setActualOdometer(e.target.value)}
                  className="w-full" placeholder="Final odometer reading" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Fuel Consumed (liters)</label>
                <input type="number" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)}
                  className="w-full" placeholder="Fuel consumed in liters" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleComplete} disabled={actionLoading || !actualOdometer || !fuelConsumed}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 text-sm">
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <CheckCircle className="w-3.5 h-3.5" /> Submit
                </button>
                <button onClick={() => setShowCompleteForm(false)}
                  className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium py-2 rounded-lg transition-colors text-sm">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
        <div className="text-center text-slate-500 text-sm py-2">No further actions available</div>
      )}
    </div>
  )
}
