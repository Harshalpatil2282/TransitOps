"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench, Loader2, CheckCircle, Search } from "lucide-react";

interface Vehicle { id: string; regNo: string; name: string; status: string; }
interface MaintenanceLog {
  id: string; vehicleId: string; serviceType: string;
  cost: number; date: string; status: string; notes: string | null;
  vehicle: Vehicle;
}

function getBadge(status: string) {
  return `badge ${status === "ACTIVE" ? "badge-active" : "badge-closed"}`;
}

interface CreateMaintenanceModalProps {
  onClose: () => void;
  onSave: () => void;
  vehicles: Vehicle[];
}

function CreateMaintenanceModal({ onClose, onSave, vehicles }: CreateMaintenanceModalProps) {
  const [form, setForm] = useState({
    vehicleId: "", serviceType: "", cost: "", date: new Date().toISOString().split("T")[0], notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show all non-retired vehicles (including AVAILABLE and ON_TRIP)
  const eligibleVehicles = vehicles.filter(v => v.status !== "RETIRED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cost: Number(form.cost) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) { setError(json.error); } else { onSave(); onClose(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Log Maintenance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="alert-warning mb-4 text-xs">
          ⚠ Adding a maintenance record will automatically set the vehicle status to <strong>IN SHOP</strong>.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vehicle *</label>
            <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
              <option value="">Select vehicle...</option>
              {eligibleVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNo} — {v.name} ({v.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Service Type *</label>
            <input className="form-input" placeholder="Oil Change, Engine Repair, Tire Replacement..." value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Cost (₹) *</label>
              <input type="number" className="form-input" placeholder="2500" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} min="0" required />
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-input" placeholder="Additional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Maintenance Record
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const [logsRes, vehiclesRes] = await Promise.all([
      fetch(`/api/maintenance?${params}`),
      fetch("/api/vehicles"),
    ]);
    const [logsJson, vehiclesJson] = await Promise.all([logsRes.json(), vehiclesRes.json()]);
    if (logsJson.success) setLogs(logsJson.data);
    if (vehiclesJson.success) setVehicles(vehiclesJson.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleClose = async (id: string) => {
    if (!confirm("Close this maintenance record? The vehicle will become Available.")) return;
    setClosingId(id);
    const res = await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    const json = await res.json();
    setClosingId(null);
    if (!json.success) { alert(json.error); } else { load(); }
  };

  const filtered = logs.filter(l =>
    l.vehicle?.regNo.toLowerCase().includes(search.toLowerCase()) ||
    l.serviceType.toLowerCase().includes(search.toLowerCase())
  );

  const totalActiveCost = logs.filter(l => l.status === "ACTIVE").reduce((s, l) => s + l.cost, 0);
  const totalClosedCost = logs.filter(l => l.status === "CLOSED").reduce((s, l) => s + l.cost, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{logs.length} maintenance records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} /> Log Maintenance
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Active Records</p>
          <p className="text-2xl font-bold text-amber-400">{logs.filter(l => l.status === "ACTIVE").length}</p>
          <p className="text-xs text-gray-600 mt-1">₹{totalActiveCost.toLocaleString()} pending</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Closed Records</p>
          <p className="text-2xl font-bold text-green-400">{logs.filter(l => l.status === "CLOSED").length}</p>
          <p className="text-xs text-gray-600 mt-1">₹{totalClosedCost.toLocaleString()} completed</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-white">₹{(totalActiveCost + totalClosedCost).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">All time maintenance cost</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="form-input pl-9" placeholder="Search by vehicle or service type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["ALL", "ACTIVE", "CLOSED"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-6 text-xs font-medium transition-all ${statusFilter === s ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 size={20} className="animate-spin inline text-gray-600" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600">
                  <Wrench size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No maintenance records found</p>
                </td></tr>
              ) : filtered.map(log => (
                <tr key={log.id}>
                  <td className="font-mono text-amber-400">{log.vehicle?.regNo}</td>
                  <td className="font-medium">{log.serviceType}</td>
                  <td className="text-green-400 font-medium">₹{log.cost.toLocaleString()}</td>
                  <td className="text-gray-400">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="text-gray-500 max-w-[200px] truncate">{log.notes ?? "—"}</td>
                  <td><span className={getBadge(log.status)}>{log.status}</span></td>
                  <td>
                    {log.status === "ACTIVE" && (
                      <button
                        onClick={() => handleClose(log.id)}
                        disabled={closingId === log.id}
                        className="px-2 py-1 rounded-5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors flex items-center gap-1"
                      >
                        {closingId === log.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateMaintenanceModal vehicles={vehicles} onClose={() => setShowModal(false)} onSave={load} />
      )}
    </div>
  );
}
