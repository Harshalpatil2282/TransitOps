import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { liters: true, cost: true } },
        maintenanceLogs: { where: { status: "CLOSED" }, select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    });

    let grandFuel = 0;
    let grandFuelLiters = 0;
    let grandMaintenance = 0;
    let grandExpenses = 0;

    const perVehicle = vehicles.map((v) => {
      const totalFuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const totalMaintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const totalExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;

      grandFuel += totalFuelCost;
      grandFuelLiters += totalFuelLiters;
      grandMaintenance += totalMaintenanceCost;
      grandExpenses += totalExpenses;

      return {
        vehicleId: v.id,
        regNo: v.regNo,
        name: v.name,
        type: v.type,
        status: v.status,
        totalFuelCost,
        totalFuelLiters,
        totalMaintenanceCost,
        totalExpenses,
        totalOperationalCost,
      };
    });

    return success({
      perVehicle,
      grandTotals: {
        totalFuelCost: grandFuel,
        totalFuelLiters: grandFuelLiters,
        totalMaintenanceCost: grandMaintenance,
        totalExpenses: grandExpenses,
        totalOperationalCost: grandFuel + grandMaintenance + grandExpenses,
      },
    });
  });
}
