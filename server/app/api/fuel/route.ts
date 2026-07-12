import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  date: z.coerce.date(),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId") ?? undefined;

    const items = await prisma.fuelLog.findMany({
      where: { ...(vehicleId ? { vehicleId } : {}) },
      include: { vehicle: true, trip: true },
      orderBy: { date: "desc" },
    });

    const totalLiters = items.reduce((s, f) => s + f.liters, 0);
    const totalCost = items.reduce((s, f) => s + f.cost, 0);

    return success({ items, summary: { totalLiters, totalCost } });
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = fuelSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const log = await prisma.fuelLog.create({
      data: parsed.data,
      include: { vehicle: true, trip: true },
    });

    return success(log, 201);
  });
}
