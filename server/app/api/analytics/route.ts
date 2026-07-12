import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function GET(_req: NextRequest) {
  return handleRoute(async () => {
    const [vehicles, allTrips, allFuelLogs, allMaintenance, allExpenses] =
      await Promise.all([
        prisma.vehicle.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.trip.findMany({
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "asc" },
        }),
        prisma.fuelLog.findMany(),
        prisma.maintenanceLog.findMany({ where: { status: "CLOSED" } }),
        prisma.expense.findMany(),
      ]);

    // ── 1. Fuel Efficiency ────────────────────────────────────────────────────
    const fuelPerVehicle = vehicles.map((v) => {
      const vTrips = allTrips.filter((t) => t.vehicleId === v.id);
      const vFuel = allFuelLogs.filter((f) => f.vehicleId === v.id);
      const distanceKm = vTrips.reduce((s, t) => s + (t.actualOdometer ?? 0), 0);
      const fuelLiters = vFuel.reduce((s, f) => s + f.liters, 0);
      const efficiency = fuelLiters > 0 ? distanceKm / fuelLiters : 0;
      return { vehicleId: v.id, regNo: v.regNo, name: v.name, distanceKm, fuelLiters, efficiency };
    });

    const totalDistance = fuelPerVehicle.reduce((s, v) => s + v.distanceKm, 0);
    const totalFuel = fuelPerVehicle.reduce((s, v) => s + v.fuelLiters, 0);
    const overallEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

    // ── 2. Operational Cost ───────────────────────────────────────────────────
    const totalFuelCost = allFuelLogs.reduce((s, f) => s + f.cost, 0);
    const totalMaintenanceCost = allMaintenance.reduce((s, m) => s + m.cost, 0);
    const totalExpenseAmount = allExpenses.reduce((s, e) => s + e.amount, 0);

    const costPerVehicle = vehicles.map((v) => {
      const fuelCost = allFuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
      const maintenanceCost = allMaintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
      const expenseAmount = allExpenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        fuelCost,
        maintenanceCost,
        expenseAmount,
        totalCost: fuelCost + maintenanceCost + expenseAmount,
      };
    });

    // ── 3. Vehicle ROI ────────────────────────────────────────────────────────
    const vehicleROI = vehicles.map((v) => {
      const revenue = allTrips
        .filter(t => t.vehicleId === v.id)
        .reduce((s, t) => s + (t.revenue ?? 0), 0);
      const maintenanceCost = allMaintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
      const fuelCost = allFuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
      const roi = v.acquisitionCost > 0
        ? ((revenue - (maintenanceCost + fuelCost)) / v.acquisitionCost) * 100
        : 0;
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        revenue,
        maintenanceCost,
        fuelCost,
        acquisitionCost: v.acquisitionCost,
        roi: Math.round(roi * 100) / 100,
      };
    });

    // ── 4. Fleet Utilization ──────────────────────────────────────────────────
    const onTripCount = vehicles.filter(v => v.status === "ON_TRIP").length;
    const nonRetired = vehicles.filter(v => v.status !== "RETIRED").length;
    const overallUtilization = nonRetired > 0 ? Math.round((onTripCount / nonRetired) * 100) : 0;

    const utilizationPerVehicle = vehicles.map((v) => {
      const vTrips = allTrips.filter(t => t.vehicleId === v.id);
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        status: v.status,
        tripsCompleted: vTrips.length,
        totalDistanceKm: vTrips.reduce((s, t) => s + (t.actualOdometer ?? 0), 0),
      };
    });

    // ── 5. Monthly Trend (last 6 months) ────────────────────────────────────
    const monthlyTrend: { month: string; trips: number; distanceKm: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthTrips = allTrips.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      monthlyTrend.push({
        month: date.toLocaleString("default", { month: "short", year: "numeric" }),
        trips: monthTrips.length,
        distanceKm: monthTrips.reduce((s, t) => s + (t.actualOdometer ?? 0), 0),
      });
    }

    // ── 6. Top Vehicles ───────────────────────────────────────────────────────
    const topVehicles = [...utilizationPerVehicle]
      .sort((a, b) => b.tripsCompleted - a.tripsCompleted)
      .slice(0, 3);

    return success({
      fuelEfficiency: {
        perVehicle: fuelPerVehicle,
        overall: Math.round(overallEfficiency * 100) / 100,
        totalDistanceKm: totalDistance,
        totalFuelLiters: totalFuel,
      },
      operationalCost: {
        fuel: totalFuelCost,
        maintenance: totalMaintenanceCost,
        expenses: totalExpenseAmount,
        total: totalFuelCost + totalMaintenanceCost + totalExpenseAmount,
        perVehicle: costPerVehicle,
      },
      vehicleROI,
      fleetUtilization: {
        overall: overallUtilization,
        totalVehicles: vehicles.length,
        onTripCount,
        perVehicle: utilizationPerVehicle,
      },
      monthlyTrend,
      topVehicles,
    });
  });
}
