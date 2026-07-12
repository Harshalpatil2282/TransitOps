"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  status: string;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
}

interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  liters: number;
  cost: number;
  date: string;
  vehicle: Vehicle;
  trip?: Trip;
}

interface Expense {
  id: string;
  vehicleId: string;
  tripId: string | null;
  type: string;
  amount: number;
  date: string;
  notes: string | null;
  vehicle: Vehicle;
  trip?: Trip;
}

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFuelDialog, setShowFuelDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);

  const loadFuelLogs = async () => {
    const res = await fetch("/api/fuel");
    const json = await res.json();
    if (json.success) {
      setFuelLogs(json.data.logs);
    }
  };

  const loadExpenses = async () => {
    const res = await fetch("/api/expenses");
    const json = await res.json();
    if (json.success) {
      setExpenses(json.data.expenses);
    }
  };

  const loadVehicles = async () => {
    const res = await fetch("/api/vehicles");
    const json = await res.json();
    if (json.success) {
      setVehicles(json.data.filter((v: Vehicle) => v.status !== "RETIRED"));
    }
  };

  const loadGrandTotal = async () => {
    const res = await fetch("/api/finance/summary");
    const json = await res.json();
    if (json.success) {
      setGrandTotal(json.data.total || 0);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadFuelLogs(), loadExpenses(), loadVehicles(), loadGrandTotal()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteFuel = async (id: string) => {
    if (!confirm("Delete this fuel log?")) return;
    const res = await fetch(`/api/fuel/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadFuelLogs();
      loadGrandTotal();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadExpenses();
      loadGrandTotal();
    }
  };

  const fuelTotal = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const fuelLitersTotal = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
  const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-6">
      {/* TOP SECTION - Fuel Logs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Fuel Logs</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Total: ₹{fuelTotal.toLocaleString()} across {fuelLitersTotal} liters
            </span>
            <button
              onClick={() => setShowFuelDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Log Fuel
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-3 px-4">Vehicle</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Liters</th>
                  <th className="pb-3 px-4">Cost (₹)</th>
                  <th className="pb-3 px-4">Trip</th>
                  <th className="pb-3 px-4">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No fuel logs yet
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-amber-400">
                        {log.vehicle.regNo}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{log.liters}</td>
                      <td className="py-3 px-4 text-slate-300">
                        ₹{log.cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.trip ? `Trip-${log.trip.id.slice(0, 8)}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteFuel(log.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {fuelLogs.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-700 font-bold">
                    <td className="py-3 px-4 text-white">TOTAL</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-white">{fuelLitersTotal}</td>
                    <td className="py-3 px-4 text-white">
                      ₹{fuelTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - Other Expenses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Other Expenses</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Total: ₹{expenseTotal.toLocaleString()}
            </span>
            <button
              onClick={() => setShowExpenseDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Expense
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-3 px-4">Vehicle</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Amount (₹)</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Notes</th>
                  <th className="pb-3 px-4">Trip</th>
                  <th className="pb-3 px-4">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No expenses yet
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-amber-400">
                        {exp.vehicle.regNo}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{exp.type}</td>
                      <td className="py-3 px-4 text-slate-300">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                        {exp.notes || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {exp.trip ? `Trip-${exp.trip.id.slice(0, 8)}` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-700 font-bold">
                    <td className="py-3 px-4 text-white">TOTAL</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-white">
                      ₹{expenseTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER - Grand Total */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">
            TOTAL OPERATIONAL COST = FUEL + EXPENSES
          </span>
          <span className="text-xl font-bold text-amber-400">
            ₹{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Log Fuel Dialog */}
      {showFuelDialog && (
        <FuelDialog
          vehicles={vehicles}
          onClose={() => setShowFuelDialog(false)}
          onSave={() => {
            loadFuelLogs();
            loadGrandTotal();
            setShowFuelDialog(false);
          }}
        />
      )}

      {/* Add Expense Dialog */}
      {showExpenseDialog && (
        <ExpenseDialog
          vehicles={vehicles}
          onClose={() => setShowExpenseDialog(false)}
          onSave={() => {
            loadExpenses();
            loadGrandTotal();
            setShowExpenseDialog(false);
          }}
        />
      )}
    </div>
  );
}

function FuelDialog({
  vehicles,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: "",
    tripId: "",
    date: new Date().toISOString().split("T")[0],
    liters: "",
    cost: "",
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.vehicleId) {
      setLoading(true);
      fetch(`/api/trips?status=COMPLETED&vehicleId=${form.vehicleId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setTrips(json.data);
          setLoading(false);
        });
    }
  }, [form.vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        liters: Number(form.liters),
        cost: Number(form.cost),
        tripId: form.tripId || null,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!json.success) {
      setError(json.error || "Failed to log fuel");
    } else {
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Log Fuel</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Vehicle *</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} — {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Trip</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading trips...</div>
            ) : (
              <select
                value={form.tripId}
                onChange={(e) => setForm({ ...form, tripId: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">No trip (optional)</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.source} → {t.destination}
                  </option>
                ))}
              </select>
            )}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Liters *</label>
              <input
                type="number"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.1"
                required
              />
            </div>
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
              {submitting ? "Saving..." : "Log Fuel"}
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

function ExpenseDialog({
  vehicles,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: "",
    tripId: "",
    type: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.vehicleId) {
      setLoading(true);
      fetch(`/api/trips?status=COMPLETED&vehicleId=${form.vehicleId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setTrips(json.data);
          setLoading(false);
        });
    }
  }, [form.vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        tripId: form.tripId || null,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!json.success) {
      setError(json.error || "Failed to add expense");
    } else {
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Vehicle *</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} — {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Trip</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading trips...</div>
            ) : (
              <select
                value={form.tripId}
                onChange={(e) => setForm({ ...form, tripId: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">No trip (optional)</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.source} → {t.destination}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Type *</label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Toll, Miscellaneous, Repair, Other..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
              {submitting ? "Saving..." : "Add Expense"}
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
