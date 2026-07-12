import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { VehicleType } from "@prisma/client";

const updateSchema = z.object({
  regNo: z.string().min(1).transform((v) => v.toUpperCase().trim()).optional(),
  name: z.string().min(1).optional(),
  type: z.nativeEnum(VehicleType).optional(),
  maxLoadKg: z.number().positive().optional(),
  acquisitionCost: z.number().positive().optional(),
  odometer: z.number().min(0).optional(),
  region: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        maintenanceLogs: { orderBy: { createdAt: "desc" } },
        fuelLogs: { orderBy: { createdAt: "desc" } },
        expenses: { orderBy: { createdAt: "desc" } },
        trips: {
          include: { driver: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vehicle) return failure("Vehicle not found", 404);
    return success(vehicle);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
    if (!vehicle) return failure("Vehicle not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;

    // Check unique regNo if changed
    if (data.regNo && data.regNo !== vehicle.regNo) {
      const dup = await prisma.vehicle.findUnique({ where: { regNo: data.regNo } });
      if (dup) return failure(`Registration number ${data.regNo} already in use.`, 409);
    }

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data,
    });

    return success(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        trips: {
          where: { status: { in: ["DRAFT", "DISPATCHED"] } },
        },
      },
    });

    if (!vehicle) return failure("Vehicle not found", 404);
    if (vehicle.status !== "AVAILABLE") {
      return failure(`Cannot delete vehicle with status ${vehicle.status}. Only AVAILABLE vehicles can be deleted.`, 400);
    }
    if (vehicle.trips.length > 0) {
      return failure("Cannot delete vehicle with active (DRAFT/DISPATCHED) trips.", 400);
    }

    await prisma.vehicle.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
