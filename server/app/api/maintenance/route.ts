import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { openMaintenance } from "@/lib/business-rules";

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.string().min(1),
  cost: z.number().positive(),
  date: z.coerce.date(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId") ?? undefined;
    const status = searchParams.get("status") as any;

    const logs = await prisma.maintenanceLog.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(status ? { status } : {}),
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
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    // Create the maintenance record first
    const log = await prisma.maintenanceLog.create({
      data: parsed.data,
      include: { vehicle: true },
    });

    // Then apply the business rule: vehicle → IN_SHOP
    await openMaintenance(parsed.data.vehicleId);

    return success(log, 201);
  });
}
