import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleType = searchParams.get("vehicleType") as any;
    const region = searchParams.get("region") ?? undefined;
    const statusFilter = searchParams.get("status") as any;

    const vehicleWhere = {
      ...(vehicleType ? { type: vehicleType } : {}),
      ...(region ? { region } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const [
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalNonRetired,
      recentTrips,
      statusBreakdown,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { ...vehicleWhere, status: "ON_TRIP" } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: "IN_SHOP" } }),
      prisma.trip.count({ where: { status: "DISPATCHED" } }),
      prisma.trip.count({ where: { status: "DRAFT" } }),
      prisma.driver.count({ where: { status: "ON_TRIP" } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: { not: "RETIRED" } } }),
      prisma.trip.findMany({
        take: 5,
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: "desc" },
      }),
      Promise.all(
        (["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const).map(
          async (status) => ({
            status,
            count: await prisma.vehicle.count({ where: { status } }),
          })
        )
      ),
    ]);

    const fleetUtilization =
      totalNonRetired > 0
        ? Math.round((activeVehicles / totalNonRetired) * 100)
        : 0;

    return success({
      kpis: {
        activeVehicles,
        availableVehicles,
        inMaintenance,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
        totalVehicles: totalNonRetired,
      },
      recentTrips,
      vehicleStatusBreakdown: statusBreakdown,
    });
  });
}
