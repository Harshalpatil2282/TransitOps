"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Filter, X, Loader2, Truck } from "lucide-react";

interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
  region: string | null;
  _count?: { trips: number };
}

const STATUS_OPTIONS = ["ALL", "AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];
const TYPE_OPTIONS = ["ALL", "VAN", "TRUCK", "BUS", "BIKE"];

function getBadge(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: "badge-available", ON_TRIP: "badge-on-trip",
    IN_SHOP: "badge-in-shop", RETIRED: "badge-retired"
  };
  return `badge ${map[status] ?? "badge-draft"}`;
}

interface VehicleModalProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: () => void;
}

function VehicleModal({ vehicle, onClose, onSave }: VehicleModalProps) {
  const [form, setForm] = useState({
    regNo: vehicle?.regNo ?? "",
    name: vehicle?.name ?? "",
    type: vehicle?.type ?? "VAN",
    maxLoadKg: vehicle?.maxLoadKg ?? "",
    acquisitionCost: vehicle?.acquisitionCost ?? "",
    odometer: vehicle?.odometer ?? 0,
    region: vehicle?.region ?? "",
    status: vehicle?.status ?? "AVAILABLE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      ...form,
      maxLoadKg: Number(form.maxLoadKg),
      acquisitionCost: Number(form.acquisitionCost),
      odometer: Number(form.odometer),
    };

    const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
    const method = vehicle ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.error);
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{vehicle ? "Edit Vehicle" : "Register Vehicle"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Registration Number *</label>
              <input className="form-input" value={form.regNo} onChange={e => setForm({...form, regNo: e.target.value.toUpperCase()})} placeholder="VAN-05" required />
            </div>
            <div>
              <label className="form-label">Vehicle Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Van Alpha" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type *</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {["VAN", "TRUCK", "BUS", "BIKE"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Region</label>
              <input className="form-input" value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="North, South..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Max Load (kg) *</label>
              <input type="number" className="form-input" value={form.maxLoadKg} onChange={e => setForm({...form, maxLoadKg: e.target.value})} placeholder="500" min="1" required />
            </div>
            <div>
              <label className="form-label">Odometer (km)</label>
              <input type="number" className="form-input" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value as any})} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Acquisition Cost (₹) *</label>
              <input type="number" className="form-input" value={form.acquisitionCost} onChange={e => setForm({...form, acquisitionCost: e.target.value})} placeholder="850000" min="1" required />
            </div>
            <div>
              <label className="form-label">Initial Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {["AVAILABLE", "IN_SHOP", "RETIRED"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {vehicle ? "Save Changes" : "Register Vehicle"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (typeFilter !== "ALL") params.append("type", typeFilter);
    const res = await fetch(`/api/vehicles?${params}`);
    const json = await res.json();
    if (json.success) setVehicles(json.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const handleDelete = async (id: string, regNo: string) => {
    if (!confirm(`Delete vehicle ${regNo}? This cannot be undone.`)) return;
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      load();
    } else {
      alert(json.error);
    }
  };

  const filtered = vehicles.filter(v =>
    v.regNo.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
          <p className="text-sm text-gray-500 mt-1">{vehicles.length} vehicles registered</p>
        </div>
        <button onClick={() => { setEditVehicle(null); setShowModal(true); }} className="btn-primary">
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="form-input pl-9"
            placeholder="Search by reg no, name, region..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-6 text-xs font-medium transition-all ${
                statusFilter === s ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-6 text-xs font-medium transition-all ${
                typeFilter === t ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Name</th>
                <th>Type</th>
                <th>Max Load</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                <th>Region</th>
                <th>Status</th>
                <th>Trips</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-600">
                  <Loader2 size={20} className="animate-spin inline" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-600">
                  <Truck size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No vehicles found</p>
                </td></tr>
              ) : filtered.map(v => (
                <tr key={v.id}>
                  <td className="font-mono text-amber-400 font-bold">{v.regNo}</td>
                  <td className="font-medium">{v.name}</td>
                  <td className="text-gray-400">{v.type}</td>
                  <td className="text-gray-300">{v.maxLoadKg.toLocaleString()} kg</td>
                  <td className="text-gray-300">{v.odometer.toLocaleString()} km</td>
                  <td className="text-gray-300">₹{v.acquisitionCost.toLocaleString()}</td>
                  <td className="text-gray-400">{v.region ?? "—"}</td>
                  <td><span className={getBadge(v.status)}>{v.status.replace("_", " ")}</span></td>
                  <td className="text-gray-400">{v._count?.trips ?? 0}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditVehicle(v); setShowModal(true); }}
                        className="p-1.5 rounded-6 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.regNo)}
                        className="p-1.5 rounded-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => setShowModal(false)}
          onSave={load}
        />
      )}
    </div>
  );
}
