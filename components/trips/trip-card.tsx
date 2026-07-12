"use client";

import { StatusBadge } from "@/components/ui/status-badge";

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle: { regNo: string };
  driver: { name: string };
  status: string;
}

interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onClick: () => void;
}

export function TripCard({ trip, isSelected, onClick }: TripCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-amber-500 border-2 bg-slate-800"
          : "border border-slate-700 hover:border-amber-500/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-slate-400">{trip.id.slice(0, 8)}</span>
        <StatusBadge status={trip.status} />
      </div>
      <div className="text-slate-100 font-medium mb-2">
        {trip.source} → {trip.destination}
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{trip.vehicle.regNo}</span>
        <span>{trip.driver.name}</span>
      </div>
    </div>
  );
}
