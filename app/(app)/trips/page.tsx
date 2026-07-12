"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Route, CheckCircle, XCircle, Play, Search, ChevronDown } from "lucide-react";

interface Vehicle { id: string; regNo: string; name: string; maxLoadKg: number; status: string; }
interface Driver { id: string; name: string; licenseNo: string; status: string; isExpired: boolean; }
interface Trip {
  id: string; source: string; destination: string;
  cargoWeightKg: number; plannedDistanceKm: number; status: string;
  vehicle: Vehicle; driver: Driver; revenue: number;
  createdAt: string; actualOdometer?: number; fuelConsumed?: number;
}

const TRIP_STATUS_OPTS = ["ALL", "DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"];

function getBadge(status: string) {
  const map: Record<string, string> = {
    DRAFT: "badge-draft", DISPATCHED: "badge-dispatched",
    COMPLETED: "badge-completed", CANCELLED: "badge-cancelled",
  };
  return `badge ${map[status] ?? "badge-draft"}`;
}

interface CreateTripModalProps {
  onClose: () => void;
  onSave: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
}

function CreateTripModal({ onClose, onSave, vehicles, drivers }: CreateTripModalProps) {
  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "",
    cargoWeightKg: "", plannedDistanceKm: "", revenue: "0",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE");
  const availableDrivers = drivers.filter(d => d.status === "AVAILABLE" && !d.isExpired);

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
        revenue: Number(form.revenue),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) { setError(json.error); } else { onSave(); onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-[560px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Create New Trip</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Source *</label>
              <input className="form-input" placeholder="Mumbai" value={form.source} onChange={e => setForm({...form, source: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Destination *</label>
              <input className="form-input" placeholder="Pune" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="form-label">Vehicle (Available only) *</label>
            <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
              <option value="">Select vehicle...</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNo} — {v.name} (max {v.maxLoadKg}kg)</option>
              ))}
            </select>
            {availableVehicles.length === 0 && <p className="text-xs text-amber-400 mt-1">⚠ No available vehicles</p>}
          </div>

          <div>
            <label className="form-label">Driver (Available, valid license) *</label>
            <select className="form-input" value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} required>
              <option value="">Select driver...</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.licenseNo})</option>
              ))}
            </select>
            {availableDrivers.length === 0 && <p className="text-xs text-amber-400 mt-1">⚠ No eligible drivers</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Cargo Weight (kg) *</label>
              <input type="number" className="form-input" placeholder="450" value={form.cargoWeightKg} onChange={e => setForm({...form, cargoWeightKg: e.target.value})} min="0.1" step="0.1" required />
              {selectedVehicle && (
                <p className="text-xs text-gray-500 mt-1">Max: {selectedVehicle.maxLoadKg}kg</p>
              )}
            </div>
            <div>
              <label className="form-label">Planned Distance (km) *</label>
              <input type="number" className="form-input" placeholder="150" value={form.plannedDistanceKm} onChange={e => setForm({...form, plannedDistanceKm: e.target.value})} min="0.1" step="0.1" required />
            </div>
          </div>

          <div>
            <label className="form-label">Revenue (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} min="0" />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Trip
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CompleteModalProps {
  trip: Trip;
  onClose: () => void;
  onSave: () => void;
}

function CompleteModal({ trip, onClose, onSave }: CompleteModalProps) {
  const [actualOdometer, setOdometer] = useState("");
  const [fuelConsumed, setFuel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", actualOdometer: Number(actualOdometer), fuelConsumed: Number(fuelConsumed) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) { setError(json.error); } else { onSave(); onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-[400px]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">Complete Trip</h2>
        <p className="text-sm text-gray-400 mb-4">{trip.source} → {trip.destination}</p>
        <div className="space-y-4">
          <div>
            <label className="form-label">Final Odometer (km) *</label>
            <input type="number" className="form-input" placeholder="12550" value={actualOdometer} onChange={e => setOdometer(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Fuel Consumed (liters) *</label>
            <input type="number" className="form-input" placeholder="18" value={fuelConsumed} onChange={e => setFuel(e.target.value)} required />
          </div>
          {error && <div className="alert-error">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleComplete} className="btn-primary flex-1 justify-center" disabled={loading || !actualOdometer || !fuelConsumed}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Mark Completed
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
      fetch(`/api/trips?${params}`),
      fetch("/api/vehicles"),
      fetch("/api/drivers"),
    ]);
    const [tripJson, vehicleJson, driverJson] = await Promise.all([
      tripsRes.json(), vehiclesRes.json(), driversRes.json()
    ]);
    if (tripJson.success) setTrips(tripJson.data);
    if (vehicleJson.success) setVehicles(vehicleJson.data);
    if (driverJson.success) setDrivers(driverJson.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAction = async (tripId: string, action: "dispatch" | "cancel") => {
    setActionLoading(tripId + action);
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setActionLoading(null);
    if (!json.success) { alert(json.error); } else { load(); }
  };

  const filtered = trips.filter(t =>
    t.source.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase()) ||
    t.vehicle?.regNo.toLowerCase().includes(search.toLowerCase()) ||
    t.driver?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Trip Management</h1>
          <p className="text-sm text-gray-500 mt-1">{trips.length} trips total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={15} /> Create Trip
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="form-input pl-9" placeholder="Search route, vehicle, driver..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TRIP_STATUS_OPTS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-6 text-xs font-medium transition-all ${statusFilter === s ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo (kg)</th>
                <th>Distance (km)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 size={20} className="animate-spin inline text-gray-600" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">
                  <Route size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No trips found</p>
                </td></tr>
              ) : filtered.map(trip => (
                <tr key={trip.id}>
                  <td>
                    <div className="font-medium">{trip.source} <span className="text-amber-500">→</span> {trip.destination}</div>
                    <div className="text-xs text-gray-600">{new Date(trip.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="font-mono text-amber-400">{trip.vehicle?.regNo}</td>
                  <td className="text-gray-300">{trip.driver?.name}</td>
                  <td className="text-gray-300">{trip.cargoWeightKg}</td>
                  <td className="text-gray-300">{trip.plannedDistanceKm}</td>
                  <td><span className={getBadge(trip.status)}>{trip.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      {trip.status === "DRAFT" && (
                        <button
                          onClick={() => handleAction(trip.id, "dispatch")}
                          disabled={actionLoading === trip.id + "dispatch"}
                          className="px-2 py-1 rounded-5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === trip.id + "dispatch" ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                          Dispatch
                        </button>
                      )}
                      {trip.status === "DISPATCHED" && (
                        <button
                          onClick={() => setCompleteTrip(trip)}
                          className="px-2 py-1 rounded-5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={11} />
                          Complete
                        </button>
                      )}
                      {["DRAFT", "DISPATCHED"].includes(trip.status) && (
                        <button
                          onClick={() => handleAction(trip.id, "cancel")}
                          disabled={actionLoading === trip.id + "cancel"}
                          className="px-2 py-1 rounded-5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center gap-1"
                        >
                          {actionLoading === trip.id + "cancel" ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateTripModal
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowCreate(false)}
          onSave={load}
        />
      )}
      {completeTrip && (
        <CompleteModal
          trip={completeTrip}
          onClose={() => setCompleteTrip(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
