"use client";

import { useEffect, useState } from "react";
import { Plus, Route, Map } from "lucide-react";
import { TripCard } from "@/components/trips/trip-card";
import { TripDetail } from "@/components/trips/trip-detail";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle: { regNo: string; name: string };
  driver: { name: string };
  status: string;
  createdAt: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualOdometer?: number;
  fuelConsumed?: number;
}

const STATUS_TABS = ["All", "Draft", "Dispatched", "Completed", "Cancelled"];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTrips = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "All") {
      params.append("status", statusFilter.toUpperCase());
    }
    const res = await fetch(`/api/trips?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setTrips(json.data);
    }
    setLoading(false);
  };

  const loadTripDetail = async (id: string) => {
    const res = await fetch(`/api/trips/${id}`);
    const json = await res.json();
    if (json.success) {
      setSelectedTrip(json.data);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTripId) {
      loadTripDetail(selectedTripId);
    } else {
      setSelectedTrip(null);
    }
  }, [selectedTripId]);

  const handleAction = async (action: string, data?: any) => {
    if (!selectedTripId) return;
    
    setActionLoading(true);
    setActionError(null);

    const res = await fetch(`/api/trips/${selectedTripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    });

    const json = await res.json();
    setActionLoading(false);

    if (!json.success) {
      setActionError(json.error || "Action failed");
    } else {
      loadTrips();
      loadTripDetail(selectedTripId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="w-80 border-r border-slate-700 flex flex-col bg-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">Trips</h1>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Create Trip
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Trip Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No trips found
              <br />
              <span className="text-xs">Try a different filter</span>
            </div>
          ) : (
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isSelected={selectedTripId === trip.id}
                onClick={() => setSelectedTripId(trip.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {!selectedTrip ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Map size={64} className="mb-4 text-slate-600" />
            <p className="text-lg">Select a trip or create one</p>
          </div>
        ) : (
          <div className="bg-slate-800 min-h-full">
            <TripDetail
              trip={selectedTrip}
              onAction={handleAction}
              actionLoading={actionLoading}
              error={actionError}
            />
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateTripDialog
          onClose={() => setShowCreateDialog(false)}
          onSave={() => {
            loadTrips();
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}
