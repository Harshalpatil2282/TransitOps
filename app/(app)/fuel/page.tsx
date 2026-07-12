"use client";

import { useEffect, useState } from "react";
import { Plus, Fuel, Receipt, Loader2, Trash2, Search } from "lucide-react";

interface Vehicle { id: string; regNo: string; name: string; }
interface Trip { id: string; source: string; destination: string; }
interface FuelLog { id: string; vehicleId: string; tripId: string | null; liters: number; cost: number; date: string; vehicle: Vehicle; trip: Trip | null; }
interface Expense { id: string; vehicleId: string; tripId: string | null; type: string; amount: number; date: string; notes: string | null; vehicle: Vehicle; trip: Trip | null; }

type TabType = "fuel" | "expenses";

interface AddFuelModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: () => void;
}

function AddFuelModal({ vehicles, onClose, onSave }: AddFuelModalProps) {
  const [form, setForm] = useState({ vehicleId: "", liters: "", cost: "", date: new Date().toISOString().split("T")[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, liters: Number(form.liters), cost: Number(form.cost) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) { setError(json.error); } else { onSave(); onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-[400px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Add Fuel Log</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vehicle *</label>
            <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Liters *</label>
              <input type="number" className="form-input" placeholder="18" value={form.liters} onChange={e => setForm({...form, liters: e.target.value})} min="0.1" step="0.1" required />
            </div>
            <div>
              <label className="form-label">Cost (₹) *</label>
              <input type="number" className="form-input" placeholder="2340" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} min="0.1" required />
            </div>
          </div>
          <div>
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          </div>
          {error && <div className="alert-error">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />} Add Fuel Log
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddExpenseModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: () => void;
}

function AddExpenseModal({ vehicles, onClose, onSave }: AddExpenseModalProps) {
  const [form, setForm] = useState({ vehicleId: "", type: "Toll", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const expenseTypes = ["Toll", "Parking", "Bridge Fee", "Loading/Unloading", "Driver Allowance", "Other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) { setError(json.error); } else { onSave(); onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-[400px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vehicle *</label>
            <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Expense Type *</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {expenseTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount (₹) *</label>
              <input type="number" className="form-input" placeholder="340" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} min="0.1" required />
            </div>
          </div>
          <div>
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input className="form-input" placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          {error && <div className="alert-error">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />} Add Expense
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FuelExpensesPage() {
  const [tab, setTab] = useState<TabType>("fuel");
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelSummary, setFuelSummary] = useState({ totalLiters: 0, totalCost: 0 });
  const [expenseSummary, setExpenseSummary] = useState({ totalAmount: 0 });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const [fuelRes, expRes, vehiclesRes] = await Promise.all([
      fetch("/api/fuel"),
      fetch("/api/expenses"),
      fetch("/api/vehicles"),
    ]);
    const [fuelJson, expJson, vehiclesJson] = await Promise.all([fuelRes.json(), expRes.json(), vehiclesRes.json()]);
    if (fuelJson.success) { setFuelLogs(fuelJson.data.items); setFuelSummary(fuelJson.data.summary); }
    if (expJson.success) { setExpenses(expJson.data.items); setExpenseSummary(expJson.data.summary); }
    if (vehiclesJson.success) setVehicles(vehiclesJson.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeleteFuel = async (id: string) => {
    if (!confirm("Delete this fuel log?")) return;
    await fetch(`/api/fuel/${id}`, { method: "DELETE" });
    load();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  };

  const filteredFuel = fuelLogs.filter(f =>
    f.vehicle?.regNo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredExpenses = expenses.filter(e =>
    e.vehicle?.regNo.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fuel & Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track all operational costs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFuelModal(true)} className="btn-secondary">
            <Fuel size={14} /> Add Fuel
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary">
            <Receipt size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Total Fuel</p>
          <p className="text-2xl font-bold text-amber-400">{fuelSummary.totalLiters.toFixed(1)} L</p>
          <p className="text-xs text-gray-600 mt-1">₹{fuelSummary.totalCost.toLocaleString()} spent</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Other Expenses</p>
          <p className="text-2xl font-bold text-purple-400">₹{expenseSummary.totalAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">{expenses.length} records</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Total Operational Cost</p>
          <p className="text-2xl font-bold text-white">₹{(fuelSummary.totalCost + expenseSummary.totalAmount).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Fuel + Expenses</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-8 overflow-hidden border border-white/10">
          <button onClick={() => setTab("fuel")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "fuel" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}>
            <Fuel size={13} className="inline mr-1" /> Fuel Logs
          </button>
          <button onClick={() => setTab("expenses")} className={`px-4 py-2 text-sm font-medium transition-all ${tab === "expenses" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}>
            <Receipt size={13} className="inline mr-1" /> Expenses
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="form-input pl-9" placeholder="Search by vehicle reg no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Fuel Logs Table */}
      {tab === "fuel" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Rate/Liter</th><th>Date</th><th>Trip</th><th></th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10"><Loader2 size={18} className="animate-spin inline text-gray-600" /></td></tr>
                ) : filteredFuel.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-600">No fuel logs found</td></tr>
                ) : filteredFuel.map(f => (
                  <tr key={f.id}>
                    <td className="font-mono text-amber-400">{f.vehicle?.regNo}</td>
                    <td className="text-blue-400 font-medium">{f.liters} L</td>
                    <td className="text-green-400 font-medium">₹{f.cost.toLocaleString()}</td>
                    <td className="text-gray-400">₹{(f.cost / f.liters).toFixed(2)}/L</td>
                    <td className="text-gray-400">{new Date(f.date).toLocaleDateString()}</td>
                    <td className="text-gray-500 text-xs">{f.trip ? `${f.trip.source}→${f.trip.destination}` : "—"}</td>
                    <td>
                      <button onClick={() => handleDeleteFuel(f.id)} className="p-1.5 rounded-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {tab === "expenses" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Amount</th><th>Date</th><th>Notes</th><th>Trip</th><th></th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10"><Loader2 size={18} className="animate-spin inline text-gray-600" /></td></tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-600">No expenses found</td></tr>
                ) : filteredExpenses.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono text-amber-400">{e.vehicle?.regNo}</td>
                    <td className="font-medium">{e.type}</td>
                    <td className="text-purple-400 font-medium">₹{e.amount.toLocaleString()}</td>
                    <td className="text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="text-gray-500 text-xs max-w-[200px] truncate">{e.notes ?? "—"}</td>
                    <td className="text-gray-500 text-xs">{e.trip ? `${e.trip.source}→${e.trip.destination}` : "—"}</td>
                    <td>
                      <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 rounded-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showFuelModal && <AddFuelModal vehicles={vehicles} onClose={() => setShowFuelModal(false)} onSave={load} />}
      {showExpenseModal && <AddExpenseModal vehicles={vehicles} onClose={() => setShowExpenseModal(false)} onSave={load} />}
    </div>
  );
}
