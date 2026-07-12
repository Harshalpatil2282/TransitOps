import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { closeMaintenance } from "@/lib/business-rules";

const actionSchema = z.object({
  action: z.literal("close"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const log = await prisma.maintenanceLog.findUniqueOrThrow({
      where: { id: params.id },
      include: { vehicle: true },
    });
    return success(log);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    await closeMaintenance(params.id);

    const updated = await prisma.maintenanceLog.findUniqueOrThrow({
      where: { id: params.id },
      include: { vehicle: true },
    });

    return success(updated);
  });
}
