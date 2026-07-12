"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle: { regNo: string; name: string };
  driver: { name: string };
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: string;
  createdAt: string;
  actualOdometer?: number;
  fuelConsumed?: number;
}

interface TripDetailProps {
  trip: Trip;
  onAction: (action: string, data?: any) => void;
  actionLoading: boolean;
  error: string | null;
}

export function TripDetail({ trip, onAction, actionLoading, error }: TripDetailProps) {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [actualOdometer, setActualOdometer] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");

  const handleComplete = () => {
    onAction("complete", {
      actualOdometer: Number(actualOdometer),
      fuelConsumed: Number(fuelConsumed),
    });
  };

  const steps = ["DRAFT", "DISPATCHED", "COMPLETED"];
  const currentStepIndex = steps.indexOf(trip.status);
  const isCancelled = trip.status === "CANCELLED";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-slate-400">{trip.id}</span>
            <StatusBadge status={trip.status} />
          </div>
          <p className="text-xs text-slate-400">
            Created: {new Date(trip.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex
                    ? "bg-amber-500 text-black"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {index <= currentStepIndex ? "●" : "○"}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index <= currentStepIndex ? "text-white" : "text-slate-500"
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-slate-700 mx-2" />
              )}
            </div>
          ))}
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2 mb-8 text-red-400">
          <XCircle size={20} />
          <span className="text-sm font-medium">Trip Cancelled</span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DetailRow label="Source" value={trip.source} />
        <DetailRow label="Destination" value={trip.destination} />
        <DetailRow label="Vehicle" value={`${trip.vehicle.regNo} - ${trip.vehicle.name}`} />
        <DetailRow label="Driver" value={trip.driver.name} />
        <DetailRow label="Cargo" value={`${trip.cargoWeightKg} kg`} />
        <DetailRow label="Planned Distance" value={`${trip.plannedDistanceKm} km`} />
        {trip.actualOdometer && (
          <DetailRow label="Actual Odometer" value={`${trip.actualOdometer} km`} />
        )}
        {trip.fuelConsumed && (
          <DetailRow label="Fuel Consumed" value={`${trip.fuelConsumed} L`} />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {trip.status === "DRAFT" && (
        <div className="space-y-3">
          <button
            onClick={() => onAction("dispatch")}
            disabled={actionLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Processing..." : "Dispatch Trip"}
          </button>
          <button
            onClick={() => onAction("cancel")}
            disabled={actionLoading}
            className="w-full border border-red-500 text-red-400 hover:bg-red-500/10 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel Trip
          </button>
        </div>
      )}

      {trip.status === "DISPATCHED" && (
        <div className="space-y-3">
          {!showCompleteForm ? (
            <>
              <button
                onClick={() => setShowCompleteForm(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium py-3 rounded-lg transition-colors"
              >
                Complete Trip
              </button>
              <button
                onClick={() => onAction("cancel")}
                disabled={actionLoading}
                className="w-full border border-red-500 text-red-400 hover:bg-red-500/10 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel Trip
              </button>
            </>
          ) : (
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Actual Odometer (km)
                </label>
                <input
                  type="number"
                  value={actualOdometer}
                  onChange={(e) => setActualOdometer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter final odometer reading"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Fuel Consumed (liters)
                </label>
                <input
                  type="number"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter fuel consumed"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  disabled={actionLoading || !actualOdometer || !fuelConsumed}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Submit"}
                </button>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(trip.status === "COMPLETED" || trip.status === "CANCELLED") && (
        <div className="text-slate-400 text-sm">No actions available</div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
