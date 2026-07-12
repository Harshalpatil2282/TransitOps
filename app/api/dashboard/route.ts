import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";
import { VehicleType, VehicleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleType = searchParams.get("vehicleType") as VehicleType | null;
    const region = searchParams.get("region");

    const vehicleFilter = {
      ...(vehicleType && { type: vehicleType }),
      ...(region && { region }),
    };

    const [
      activeVehicles,
      availableVehicles,
      inMaintenance,
      retiredVehicles,
      totalVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      recentTrips,
      vehicleStatusBreakdown,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { ...vehicleFilter, status: "ON_TRIP" } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: "IN_SHOP" } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: "RETIRED" } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: { not: "RETIRED" } } }),
      prisma.trip.count({ where: { status: "DISPATCHED" } }),
      prisma.trip.count({ where: { status: "DRAFT" } }),
      prisma.driver.count({ where: { status: "ON_TRIP" } }),
      prisma.trip.findMany({
        take: 5,
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vehicle.groupBy({
        by: ["status"],
        _count: { status: true },
        where: vehicleFilter,
      }),
    ]);

    const fleetUtilization = totalVehicles > 0
      ? Math.round((activeVehicles / totalVehicles) * 100 * 10) / 10
      : 0;

    const statusMap = vehicleStatusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<VehicleStatus, number>);

    return success({
      kpis: {
        activeVehicles,
        availableVehicles,
        inMaintenance,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization,
        totalVehicles,
        retiredVehicles,
      },
      recentTrips,
      vehicleStatusBreakdown: [
        { status: "AVAILABLE", count: statusMap["AVAILABLE"] ?? 0 },
        { status: "ON_TRIP", count: statusMap["ON_TRIP"] ?? 0 },
        { status: "IN_SHOP", count: statusMap["IN_SHOP"] ?? 0 },
        { status: "RETIRED", count: statusMap["RETIRED"] ?? 0 },
      ],
    });
  });
}
