import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { openMaintenance } from "@/lib/business-rules";
import { MaintenanceStatus } from "@prisma/client";

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.string().min(1),
  cost: z.number().positive(),
  date: z.string().or(z.date()).transform((v) => new Date(v)),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");
    const status = searchParams.get("status") as MaintenanceStatus | null;

    const logs = await prisma.maintenanceLog.findMany({
      where: {
        ...(vehicleId && { vehicleId }),
        ...(status && { status }),
      },
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    });

    return success(logs);
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = maintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.issues.map((e: any) => e.message).join(", "), 400);
    }

    const { vehicleId, serviceType, cost, date, notes } = parsed.data;

    // This will throw if vehicle is RETIRED or not found
    await openMaintenance(vehicleId);

    const log = await prisma.maintenanceLog.create({
      data: { vehicleId, serviceType, cost, date, notes, status: "ACTIVE" },
      include: { vehicle: true },
    });

    return success(log, 201);
  });
}
