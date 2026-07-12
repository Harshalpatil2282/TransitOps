"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  maxLoadKg: number;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  status: string;
}

interface CreateTripDialogProps {
  onClose: () => void;
  onSave: () => void;
}

export function CreateTripDialog({ onClose, onSave }: CreateTripDialogProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [vehiclesRes, driversRes] = await Promise.all([
        fetch("/api/vehicles?status=AVAILABLE"),
        fetch("/api/drivers?status=AVAILABLE"),
      ]);
      const [vehiclesJson, driversJson] = await Promise.all([
        vehiclesRes.json(),
        driversRes.json(),
      ]);
      if (vehiclesJson.success) setVehicles(vehiclesJson.data);
      if (driversJson.success) setDrivers(driversJson.data);
      setLoading(false);
    };
    loadData();
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const selectedDriver = drivers.find((d) => d.id === form.driverId);

  const cargoWeight = Number(form.cargoWeightKg);
  const exceedsCapacity =
    selectedVehicle && cargoWeight > selectedVehicle.maxLoadKg;
  const withinCapacity =
    selectedVehicle && cargoWeight > 0 && cargoWeight <= selectedVehicle.maxLoadKg;

  const isDriverExpiringSoon = selectedDriver
    ? new Date(selectedDriver.licenseExpiry) <=
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: form.source,
        destination: form.destination,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!json.success) {
      setError(json.error || "Failed to create trip");
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create Trip</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Source *</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Destination *
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Vehicle *</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading vehicles...</div>
            ) : (
              <select
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} — {v.name} ({v.maxLoadKg}kg max)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Driver *</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading drivers...</div>
            ) : (
              <select
                value={form.driverId}
                onChange={(e) =>
                  setForm({ ...form, driverId: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.licenseCategory} (exp:{" "}
                    {new Date(d.licenseExpiry).toLocaleDateString()})
                    {isDriverExpiringSoon && d.id === form.driverId && " ⚠"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Cargo Weight (kg) *
              </label>
              <input
                type="number"
                value={form.cargoWeightKg}
                onChange={(e) =>
                  setForm({ ...form, cargoWeightKg: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.1"
                required
              />
              {selectedVehicle && (
                <p className="text-xs text-slate-400 mt-1">
                  Max: {selectedVehicle.maxLoadKg}kg
                </p>
              )}
              {exceedsCapacity && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                  <AlertTriangle size={14} />
                  <span>
                    ⚠ Exceeds capacity — Vehicle max: {selectedVehicle.maxLoadKg}
                    kg, Entered: {cargoWeight}kg
                  </span>
                </div>
              )}
              {withinCapacity && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
                  <CheckCircle size={14} />
                  <span>
                    ✓ Within capacity ({cargoWeight}/{selectedVehicle.maxLoadKg} kg)
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Planned Distance (km) *
              </label>
              <input
                type="number"
                value={form.plannedDistanceKm}
                onChange={(e) =>
                  setForm({ ...form, plannedDistanceKm: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || exceedsCapacity}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Trip"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
