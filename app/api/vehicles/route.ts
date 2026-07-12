import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { VehicleType, VehicleStatus } from "@prisma/client";

const vehicleSchema = z.object({
  regNo: z.string().min(1).transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1),
  type: z.nativeEnum(VehicleType),
  maxLoadKg: z.number().positive(),
  acquisitionCost: z.number().positive(),
  odometer: z.number().min(0).default(0),
  region: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).default("AVAILABLE"),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as VehicleType | null;
    const status = searchParams.get("status") as VehicleStatus | null;
    const region = searchParams.get("region");

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(type && { type }),
        ...(status && { status }),
        ...(region && { region }),
      },
      include: {
        _count: { select: { trips: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(vehicles);
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { regNo, name, type, maxLoadKg, acquisitionCost, odometer, region, status } = parsed.data;

    const existing = await prisma.vehicle.findUnique({ where: { regNo } });
    if (existing) {
      return failure(`Vehicle with registration number ${regNo} already exists.`, 409);
    }

    const vehicle = await prisma.vehicle.create({
      data: { regNo, name, type, maxLoadKg, acquisitionCost, odometer, region, status },
    });

    return success(vehicle, 201);
  });
}
