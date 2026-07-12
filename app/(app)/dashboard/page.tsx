"use client";

import { useEffect, useState } from "react";
import {
  Truck, Users, Route, Wrench, Activity, TrendingUp,
  RefreshCw, ArrowRight, Clock
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface DashboardData {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
    totalVehicles: number;
  };
  recentTrips: any[];
  vehicleStatusBreakdown: { status: string; count: number }[];
}

const STATUS_COLORS = ["#10b981", "#60a5fa", "#f59e0b", "#6b7280"];

function getBadgeClass(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: "badge-available", ON_TRIP: "badge-on-trip", IN_SHOP: "badge-in-shop",
    RETIRED: "badge-retired", DRAFT: "badge-draft", DISPATCHED: "badge-dispatched",
    COMPLETED: "badge-completed", CANCELLED: "badge-cancelled",
  };
  return `badge ${map[status] ?? "badge-draft"}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const json = await res.json();
      if (json.success) setData(json.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const kpis = [
    { label: "Active Vehicles", value: data?.kpis.activeVehicles ?? 0, icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Available Vehicles", value: data?.kpis.availableVehicles ?? 0, icon: Truck, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "In Maintenance", value: data?.kpis.inMaintenance ?? 0, icon: Wrench, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Active Trips", value: data?.kpis.activeTrips ?? 0, icon: Route, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending Trips", value: data?.kpis.pendingTrips ?? 0, icon: Clock, color: "text-gray-400", bg: "bg-gray-500/10" },
    { label: "Drivers On Duty", value: data?.kpis.driversOnDuty ?? 0, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of your fleet operations</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Fleet Utilization Banner */}
      {data && (
        <div className="mb-6 p-5 rounded-12 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Fleet Utilization</span>
            </div>
            <span className="text-xl font-bold text-amber-400">{data.kpis.fleetUtilization}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.kpis.fleetUtilization}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.kpis.activeVehicles} of {data.kpis.totalVehicles} non-retired vehicles on trip
          </p>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-white">{loading ? "—" : value}</p>
              </div>
              <div className={`p-2 rounded-8 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Recent Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Status Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Fleet Status</h3>
          {data && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.vehicleStatusBreakdown.filter(d => d.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name.replace("_", " ")}: ${value}`}
                  labelLine={false}
                >
                  {data.vehicleStatusBreakdown.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a28", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#f1f1f5" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {data && (
            <div className="mt-3 space-y-2">
              {data.vehicleStatusBreakdown.map(({ status, count }, i) => (
                <div key={status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[i] }} />
                    <span className="text-gray-400">{status.replace("_", " ")}</span>
                  </div>
                  <span className="font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trips */}
        <div className="glass-card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Trips</h3>
            <Link href="/trips" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-8 bg-white/3 animate-pulse" />
              ))}
            </div>
          ) : data?.recentTrips.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">No trips yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentTrips.map((trip: any) => (
                    <tr key={trip.id}>
                      <td>
                        <span className="font-medium">{trip.source}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="font-medium">{trip.destination}</span>
                      </td>
                      <td className="text-gray-400">{trip.vehicle?.regNo}</td>
                      <td className="text-gray-400">{trip.driver?.name}</td>
                      <td><span className={getBadgeClass(trip.status)}>{trip.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/fleet", label: "Add Vehicle", icon: Truck, color: "amber" },
          { href: "/drivers", label: "Add Driver", icon: Users, color: "blue" },
          { href: "/trips", label: "Create Trip", icon: Route, color: "green" },
          { href: "/maintenance", label: "Log Maintenance", icon: Wrench, color: "orange" },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="glass-card p-4 flex items-center gap-3 hover:border-amber-500/20 transition-colors group">
            <Icon size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <ArrowRight size={12} className="ml-auto text-gray-600 group-hover:text-amber-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
