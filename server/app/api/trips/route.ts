import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const tripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  cargoWeightKg: z.number().positive(),
  plannedDistanceKm: z.number().positive(),
  revenue: z.number().nonnegative().default(0),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const vehicleId = searchParams.get("vehicleId") ?? undefined;
    const driverId = searchParams.get("driverId") ?? undefined;

    const trips = await prisma.trip.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(driverId ? { driverId } : {}),
      },
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return success(trips);
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = tripSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const { vehicleId, driverId, cargoWeightKg } = parsed.data;

    // Pre-flight checks
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return failure("Vehicle not found.", 404);
    if (vehicle.status !== "AVAILABLE")
      return failure(
        `Vehicle ${vehicle.regNo} is not available (current status: ${vehicle.status}).`,
        422
      );

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return failure("Driver not found.", 404);
    if (driver.status === "SUSPENDED")
      return failure(`Driver ${driver.name} is SUSPENDED and cannot be assigned.`, 422);
    if (driver.status !== "AVAILABLE")
      return failure(
        `Driver ${driver.name} is not available (current status: ${driver.status}).`,
        422
      );
    if (new Date(driver.licenseExpiry) < new Date())
      return failure(
        `Driver ${driver.name} has an expired license.`,
        422
      );
    if (cargoWeightKg > vehicle.maxLoadKg)
      return failure(
        `Cargo ${cargoWeightKg}kg exceeds vehicle capacity of ${vehicle.maxLoadKg}kg.`,
        422
      );

    const trip = await prisma.trip.create({
      data: { ...parsed.data, status: "DRAFT" },
      include: { vehicle: true, driver: true },
    });

    return success(trip, 201);
  });
}
