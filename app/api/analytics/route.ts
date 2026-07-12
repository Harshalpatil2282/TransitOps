import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const [vehicles, completedTrips, allFuelLogs, allMaintenanceLogs, allExpenses] = await Promise.all([
      prisma.vehicle.findMany({
        include: {
          trips: { where: { status: "COMPLETED" }, select: { actualOdometer: true, plannedDistanceKm: true } },
          fuelLogs: { select: { liters: true, cost: true } },
          maintenanceLogs: { where: { status: "CLOSED" }, select: { cost: true } },
          expenses: { select: { amount: true } },
        },
      }),
      prisma.trip.findMany({
        where: { status: "COMPLETED" },
        select: { actualOdometer: true, plannedDistanceKm: true, createdAt: true, revenue: true },
      }),
      prisma.fuelLog.aggregate({ _sum: { liters: true, cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { status: "CLOSED" }, _sum: { cost: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    // 1. Fuel Efficiency per vehicle
    let totalDistance = 0;
    let totalFuel = 0;

    const fuelEfficiency = vehicles.map((v) => {
      const distanceKm = v.trips.reduce((sum, t) => sum + (t.actualOdometer ?? t.plannedDistanceKm), 0);
      const fuelLiters = v.fuelLogs.reduce((sum, f) => sum + f.liters, 0);
      const efficiency = fuelLiters > 0 ? distanceKm / fuelLiters : 0;
      totalDistance += distanceKm;
      totalFuel += fuelLiters;
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        distanceKm,
        fuelLiters,
        efficiency: Math.round(efficiency * 100) / 100,
      };
    });

    const overallEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0;

    // 2. Operational Cost
    const fuelCost = allFuelLogs._sum.cost ?? 0;
    const maintenanceCost = allMaintenanceLogs._sum.cost ?? 0;
    const expenseAmount = allExpenses._sum.amount ?? 0;
    const totalCost = fuelCost + maintenanceCost + expenseAmount;

    const perVehicleCost = vehicles.map((v) => {
      const vFuel = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const vMaint = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const vExp = v.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        fuelCost: vFuel,
        maintenanceCost: vMaint,
        expenseAmount: vExp,
        totalCost: vFuel + vMaint + vExp,
      };
    });

    // 3. Vehicle ROI
    const vehicleROI = vehicles.map((v) => {
      const vFuel = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const vMaint = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const revenue = v.trips.reduce((s, t: any) => s + (t.revenue ?? 0), 0);
      const roi = v.acquisitionCost > 0
        ? Math.round(((revenue - (vMaint + vFuel)) / v.acquisitionCost) * 100 * 100) / 100
        : 0;
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        revenue,
        maintenanceCost: vMaint,
        fuelCost: vFuel,
        acquisitionCost: v.acquisitionCost,
        roi,
      };
    });

    // 4. Fleet Utilization
    const totalVehicles = vehicles.length;
    const onTripCount = vehicles.filter((v) => v.status === "ON_TRIP").length;
    const nonRetiredCount = vehicles.filter((v) => v.status !== "RETIRED").length;
    const overallUtilization = nonRetiredCount > 0
      ? Math.round((onTripCount / nonRetiredCount) * 100 * 10) / 10
      : 0;

    const perVehicleUtil = vehicles.map((v) => ({
      vehicleId: v.id,
      regNo: v.regNo,
      name: v.name,
      status: v.status,
      tripsCompleted: v.trips.length,
      totalDistanceKm: v.trips.reduce((s, t) => s + (t.actualOdometer ?? t.plannedDistanceKm), 0),
    }));

    // 5. Monthly trend (last 6 months)
    const now = new Date();
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthTrips = completedTrips.filter(
        (t) => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end
      );

      monthlyTrend.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        trips: monthTrips.length,
        distanceKm: monthTrips.reduce((s, t) => s + (t.actualOdometer ?? t.plannedDistanceKm), 0),
      });
    }

    // 6. Top vehicles by trips completed
    const topVehicles = [...perVehicleUtil]
      .sort((a, b) => b.tripsCompleted - a.tripsCompleted)
      .slice(0, 3);

    return success({
      fuelEfficiency: {
        perVehicle: fuelEfficiency,
        overall: overallEfficiency,
        totalDistanceKm: totalDistance,
        totalFuelLiters: totalFuel,
      },
      operationalCost: {
        fuel: fuelCost,
        maintenance: maintenanceCost,
        expenses: expenseAmount,
        total: totalCost,
        perVehicle: perVehicleCost,
      },
      vehicleROI,
      fleetUtilization: {
        overall: overallUtilization,
        totalVehicles,
        onTripCount,
        perVehicle: perVehicleUtil,
      },
      monthlyTrend,
      topVehicles,
    });
  });
}
