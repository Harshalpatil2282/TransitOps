import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  date: z.string().or(z.date()).transform((v) => new Date(v)),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const [fuelLogs, aggregate] = await Promise.all([
      prisma.fuelLog.findMany({
        where: { ...(vehicleId && { vehicleId }) },
        include: { vehicle: true, trip: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.fuelLog.aggregate({
        where: { ...(vehicleId && { vehicleId }) },
        _sum: { liters: true, cost: true },
      }),
    ]);

    return success({
      items: fuelLogs,
      summary: {
        totalLiters: aggregate._sum.liters ?? 0,
        totalCost: aggregate._sum.cost ?? 0,
      },
    });
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = fuelSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const log = await prisma.fuelLog.create({
      data: parsed.data,
      include: { vehicle: true, trip: true },
    });

    return success(log, 201);
  });
}
