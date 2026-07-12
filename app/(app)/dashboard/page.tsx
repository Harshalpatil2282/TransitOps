"use client";

import { useEffect, useState } from "react";
import {
  Truck, CheckCircle, Wrench, Navigation, Clock,
  UserCheck, Activity
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface DashboardData {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
  };
  recentTrips: any[];
  vehicleStatusBreakdown: { status: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const [filters, setFilters] = useState({
    vehicleType: "All",
    status: "All",
    region: ""
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.vehicleType !== "All") params.append("vehicleType", filters.vehicleType);
    if (filters.status !== "All") params.append("status", filters.status);
    if (filters.region) params.append("region", filters.region);
    
    const res = await fetch(`/api/dashboard?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) setData(json.data);
    }
    setLoading(false);
    setLastRefreshed(new Date());
  };

  useEffect(() => { load(); }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const kpis = [
    { label: "Active Vehicles", value: data?.kpis.activeVehicles ?? 0, icon: Truck, color: "text-blue-400" },
    { label: "Available Vehicles", value: data?.kpis.availableVehicles ?? 0, icon: CheckCircle, color: "text-green-400" },
    { label: "In Maintenance", value: data?.kpis.inMaintenance ?? 0, icon: Wrench, color: "text-amber-400" },
    { label: "Active Trips", value: data?.kpis.activeTrips ?? 0, icon: Navigation, color: "text-blue-400" },
    { label: "Pending Trips", value: data?.kpis.pendingTrips ?? 0, icon: Clock, color: "text-gray-400" },
    { label: "Drivers On Duty", value: data?.kpis.driversOnDuty ?? 0, icon: UserCheck, color: "text-purple-400" },
    { label: "Fleet Utilization", value: `${data?.kpis.fleetUtilization ?? 0}%`, icon: Activity, color: "text-amber-400" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {lastRefreshed && (
            <p className="text-sm text-slate-400 mt-1">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6 justify-end">
        <select
          value={filters.vehicleType}
          onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">Vehicle Type: All</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Bus">Bus</option>
          <option value="Bike">Bike</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">Status: All</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <input
          type="text"
          placeholder="Region"
          value={filters.region}
          onChange={(e) => setFilters({ ...filters, region: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon size={18} className="text-slate-600" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">
              {loading ? (
                <span className="animate-pulse">—</span>
              ) : (
                value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Trips</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.recentTrips.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock size={48} className="mx-auto mb-3 text-slate-600" />
              <p>No trips yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                    <th className="pb-3">Trip</th>
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentTrips.slice(0, 5).map((trip: any) => (
                    <tr key={trip.id} className="border-b border-slate-700/50">
                      <td className="py-3 font-mono text-xs text-slate-400">
                        {trip.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-slate-100">
                        {trip.source} → {trip.destination}
                      </td>
                      <td className="py-3 text-slate-400">{trip.vehicle?.regNo}</td>
                      <td className="py-3 text-slate-400">{trip.driver?.name}</td>
                      <td className="py-3">
                        <StatusBadge status={trip.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Fleet Status</h2>
          {data && (
            <div className="space-y-3">
              {data.vehicleStatusBreakdown.map(({ status, count }) => {
                const colors: Record<string, string> = {
                  AVAILABLE: "bg-green-500",
                  ON_TRIP: "bg-blue-500",
                  IN_SHOP: "bg-amber-500",
                  RETIRED: "bg-slate-500",
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-slate-500"}`} />
                      <span className="text-slate-300">{status.replace("_", " ")}</span>
                    </div>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Fleet Utilization Progress */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Fleet Utilization</span>
              <span className="text-sm font-bold text-amber-400">{data?.kpis.fleetUtilization ?? 0}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data?.kpis.fleetUtilization ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
