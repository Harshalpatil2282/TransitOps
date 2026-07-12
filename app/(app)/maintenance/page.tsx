"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench, AlertTriangle, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

interface Vehicle {
  id: string;
  regNo: string;
  name: string;
  status: string;
}

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: string;
  notes: string | null;
  vehicle: Vehicle;
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (vehicleFilter) params.append("vehicleId", vehicleFilter);
    const res = await fetch(`/api/maintenance?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setLogs(json.data);
    }
    setLoading(false);
  };

  const loadVehicles = async () => {
    const res = await fetch("/api/vehicles");
    const json = await res.json();
    if (json.success) {
      setVehicles(json.data);
    }
  };

  const loadLogDetail = async (id: string) => {
    const res = await fetch(`/api/maintenance/${id}`);
    const json = await res.json();
    if (json.success) {
      setSelectedLog(json.data);
    }
  };

  useEffect(() => {
    loadLogs();
    loadVehicles();
  }, [vehicleFilter]);

  useEffect(() => {
    if (selectedLogId) {
      loadLogDetail(selectedLogId);
    } else {
      setSelectedLog(null);
    }
  }, [selectedLogId]);

  const handleCloseMaintenance = async () => {
    if (!selectedLogId) return;
    
    setActionLoading(true);
    const res = await fetch(`/api/maintenance/${selectedLogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });

    const json = await res.json();
    setActionLoading(false);

    if (json.success) {
      loadLogs();
      loadLogDetail(selectedLogId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="w-80 border-r border-slate-700 flex flex-col bg-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">Maintenance</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Record
            </button>
          </div>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.regNo} — {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Maintenance List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No maintenance records
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`bg-slate-800 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedLogId === log.id
                    ? "border-amber-500 border-2 bg-slate-800"
                    : "border border-slate-700 hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-amber-400">
                    {log.vehicle.regNo}
                  </span>
                  <StatusBadge status={log.status} />
                </div>
                <div className="text-sm text-slate-100 mb-1">{log.serviceType}</div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(log.date).toLocaleDateString()}</span>
                  <span>₹{log.cost.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {!selectedLog ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Wrench size={64} className="mb-4 text-slate-600" />
            <p className="text-lg">Select a maintenance record</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Service Record</h2>
              <StatusBadge status={selectedLog.status} />
            </div>

            {/* Detail Card */}
            <div className="bg-slate-800 rounded-xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow
                  label="Vehicle"
                  value={`${selectedLog.vehicle.regNo} - ${selectedLog.vehicle.name}`}
                />
                <DetailRow label="Service Type" value={selectedLog.serviceType} />
                <DetailRow
                  label="Date"
                  value={new Date(selectedLog.date).toLocaleDateString()}
                />
                <DetailRow label="Cost" value={`₹${selectedLog.cost.toLocaleString()}`} />
                {selectedLog.notes && (
                  <DetailRow label="Notes" value={selectedLog.notes} />
                )}
              </div>
            </div>

            {/* Status Note */}
            {selectedLog.status === "ACTIVE" && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="mt-1">
                  This vehicle is currently In Shop and unavailable for dispatch.
                </p>
              </div>
            )}

            {selectedLog.status === "CLOSED" && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span className="font-medium">Completed</span>
                </div>
                <p className="mt-1">
                  This vehicle has been returned to Available.
                </p>
              </div>
            )}

            {/* Action Button */}
            {selectedLog.status === "ACTIVE" && (
              <button
                onClick={handleCloseMaintenance}
                disabled={actionLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Close Maintenance"}
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <MaintenanceForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            loadLogs();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
