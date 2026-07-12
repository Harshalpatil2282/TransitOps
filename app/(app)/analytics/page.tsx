"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Fuel, DollarSign, Activity, Loader2, Download } from "lucide-react";

interface AnalyticsData {
  fuelEfficiency: {
    perVehicle: { vehicleId: string; regNo: string; name: string; distanceKm: number; fuelLiters: number; efficiency: number }[];
    overall: number;
    totalDistanceKm: number;
    totalFuelLiters: number;
  };
  operationalCost: {
    fuel: number; maintenance: number; expenses: number; total: number;
    perVehicle: { vehicleId: string; regNo: string; name: string; fuelCost: number; maintenanceCost: number; expenseAmount: number; totalCost: number }[];
  };
  vehicleROI: { vehicleId: string; regNo: string; name: string; revenue: number; maintenanceCost: number; fuelCost: number; acquisitionCost: number; roi: number }[];
  fleetUtilization: {
    overall: number; totalVehicles: number; onTripCount: number;
    perVehicle: { vehicleId: string; regNo: string; name: string; status: string; tripsCompleted: number; totalDistanceKm: number }[];
  };
  monthlyTrend: { month: string; trips: number; distanceKm: number }[];
  topVehicles: { vehicleId: string; regNo: string; name: string; tripsCompleted: number; totalDistanceKm: number }[];
}

const COLORS = ["#f59e0b", "#60a5fa", "#10b981", "#a78bfa", "#f87171"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a28] border border-white/10 rounded-8 p-3 text-xs shadow-lg">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || p.stroke || "#f1f1f5" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(j => {
      if (j.success) setData(j.data);
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ["Vehicle", "Reg No", "Fuel Cost (₹)", "Maintenance Cost (₹)", "Expenses (₹)", "Total Cost (₹)", "ROI (%)"],
      ...data.operationalCost.perVehicle.map(v => {
        const roi = data.vehicleROI.find(r => r.vehicleId === v.vehicleId);
        return [v.name, v.regNo, v.fuelCost, v.maintenanceCost, v.expenseAmount, v.totalCost, roi?.roi ?? 0];
      }),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transitops-analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">Computing analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-gray-500">Failed to load analytics.</div>;

  const costBreakdown = [
    { name: "Fuel", value: data.operationalCost.fuel },
    { name: "Maintenance", value: data.operationalCost.maintenance },
    { name: "Expenses", value: data.operationalCost.expenses },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Operational insights and performance metrics</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <Fuel size={14} className="text-amber-400" />
            <span className="text-xs text-gray-500">Fuel Efficiency</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{data.fuelEfficiency.overall.toFixed(2)}</p>
          <p className="text-xs text-gray-600">km per liter (avg)</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-red-400" />
            <span className="text-xs text-gray-500">Total Op. Cost</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{data.operationalCost.total.toLocaleString()}</p>
          <p className="text-xs text-gray-600">fuel + maintenance + expenses</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-blue-400" />
            <span className="text-xs text-gray-500">Fleet Utilization</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{data.fleetUtilization.overall}%</p>
          <p className="text-xs text-gray-600">{data.fleetUtilization.onTripCount}/{data.fleetUtilization.totalVehicles} on trip</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-gray-500">Total Distance</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{data.fuelEfficiency.totalDistanceKm.toLocaleString()}</p>
          <p className="text-xs text-gray-600">km driven (completed trips)</p>
        </div>
      </div>

      {/* Monthly Trend + Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Trip Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#666680" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666680" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="trips" name="Trips" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Cost Breakdown</h3>
          {costBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {costBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {costBreakdown.map((item, i) => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white">₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-600 text-sm">No cost data yet</div>
          )}
        </div>
      </div>

      {/* Fuel Efficiency per Vehicle */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Fuel Efficiency by Vehicle (km/L)</h3>
        {data.fuelEfficiency.perVehicle.filter(v => v.fuelLiters > 0).length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.fuelEfficiency.perVehicle.filter(v => v.fuelLiters > 0)}>
              <XAxis dataKey="regNo" tick={{ fontSize: 11, fill: "#666680" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666680" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="efficiency" name="km/L" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-600 text-sm">No fuel data yet</div>
        )}
      </div>

      {/* Vehicle ROI Table */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Vehicle ROI Analysis</h3>
          <p className="text-xs text-gray-500 mt-1">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Acquisition Cost</th><th>Revenue</th><th>Fuel Cost</th><th>Maintenance</th><th>ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.vehicleROI.map(v => (
                <tr key={v.vehicleId}>
                  <td>
                    <span className="font-mono text-amber-400">{v.regNo}</span>
                    <span className="text-gray-500 ml-2 text-xs">{v.name}</span>
                  </td>
                  <td className="text-gray-300">₹{v.acquisitionCost.toLocaleString()}</td>
                  <td className="text-green-400">₹{v.revenue.toLocaleString()}</td>
                  <td className="text-red-400">₹{v.fuelCost.toLocaleString()}</td>
                  <td className="text-orange-400">₹{v.maintenanceCost.toLocaleString()}</td>
                  <td>
                    <span className={`font-bold ${v.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {v.roi.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Vehicles */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Top Vehicles by Trips Completed</h3>
        {data.topVehicles.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-6">No completed trips yet</p>
        ) : (
          <div className="space-y-3">
            {data.topVehicles.map((v, i) => (
              <div key={v.vehicleId} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{v.name} <span className="text-amber-400 font-mono text-xs">({v.regNo})</span></p>
                  <p className="text-xs text-gray-500">{v.totalDistanceKm.toFixed(0)} km total</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{v.tripsCompleted}</p>
                  <p className="text-xs text-gray-500">trips</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
