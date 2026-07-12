"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  status: string;
}

interface MaintenanceFormProps {
  onClose: () => void;
  onSave: () => void;
}

export function MaintenanceForm({ onClose, onSave }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "",
    cost: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.success) {
        setVehicles(json.data.filter((v: Vehicle) => v.status !== "RETIRED"));
      }
      setLoading(false);
    };
    loadVehicles();
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const isAlreadyInShop = selectedVehicle?.status === "IN_SHOP";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cost: Number(form.cost),
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!json.success) {
      setError(json.error || "Failed to create maintenance record");
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Add Maintenance Record</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    {v.regNo} — {v.name} ({v.status})
                  </option>
                ))}
              </select>
            )}
            {isAlreadyInShop && (
              <div className="flex items-center gap-2 mt-2 text-amber-400 text-xs">
                <AlertTriangle size={14} />
                <span>
                  ⚠ This vehicle is already In Shop. A new record will be added.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Service Type *
            </label>
            <input
              type="text"
              value={form.serviceType}
              onChange={(e) =>
                setForm({ ...form, serviceType: e.target.value })
              }
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Oil Change, Tyre Replace, Engine Repair..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Cost (₹) *</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Add Record"}
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
