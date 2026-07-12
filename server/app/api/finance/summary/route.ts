import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function GET(_req: NextRequest) {
  return handleRoute(async () => {
    const [vehicles, fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      prisma.vehicle.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.fuelLog.findMany(),
      prisma.maintenanceLog.findMany({ where: { status: "CLOSED" } }),
      prisma.expense.findMany(),
    ]);

    const perVehicle = vehicles.map((v) => {
      const totalFuelCost = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
      const totalFuelLiters = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.liters, 0);
      const totalMaintenanceCost = maintenanceLogs.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
      const totalExpenses = expenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        totalFuelCost,
        totalFuelLiters,
        totalMaintenanceCost,
        totalExpenses,
        totalOperationalCost: totalFuelCost + totalMaintenanceCost + totalExpenses,
      };
    });

    const grandTotals = {
      totalFuelCost: perVehicle.reduce((s, v) => s + v.totalFuelCost, 0),
      totalMaintenanceCost: perVehicle.reduce((s, v) => s + v.totalMaintenanceCost, 0),
      totalExpenses: perVehicle.reduce((s, v) => s + v.totalExpenses, 0),
      totalOperationalCost: perVehicle.reduce((s, v) => s + v.totalOperationalCost, 0),
    };

    return success({ perVehicle, grandTotals });
  });
}
