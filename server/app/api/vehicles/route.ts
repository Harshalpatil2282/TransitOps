import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const vehicleSchema = z.object({
  regNo: z.string().min(1).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1),
  type: z.enum(["VAN", "TRUCK", "BUS", "BIKE"]),
  maxLoadKg: z.number().positive(),
  acquisitionCost: z.number().positive(),
  odometer: z.number().nonnegative().default(0),
  region: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).default("AVAILABLE"),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as any;
    const status = searchParams.get("status") as any;
    const region = searchParams.get("region");

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(region ? { region } : {}),
      },
      include: { _count: { select: { trips: true } } },
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
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const existing = await prisma.vehicle.findUnique({
      where: { regNo: parsed.data.regNo },
    });
    if (existing) {
      return failure(`Vehicle with regNo '${parsed.data.regNo}' already exists.`, 409);
    }

    const vehicle = await prisma.vehicle.create({ data: parsed.data });
    return success(vehicle, 201);
  });
}
