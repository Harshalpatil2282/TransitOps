import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { closeMaintenance } from "@/lib/business-rules";

const actionSchema = z.object({
  action: z.literal("close"),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    if (!log) return failure("Maintenance log not found", 404);
    return success(log);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return failure("Invalid action. Use { action: 'close' }.", 400);
    }

    await closeMaintenance(params.id);

    const updated = await prisma.maintenanceLog.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    return success(updated);
  }, 422);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const log = await prisma.maintenanceLog.findUnique({ where: { id: params.id } });
    if (!log) return failure("Maintenance log not found", 404);

    await prisma.maintenanceLog.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
