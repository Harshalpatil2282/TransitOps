import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const patchSchema = z.object({
  regNo: z.string().min(1).transform((v) => v.trim().toUpperCase()).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["VAN", "TRUCK", "BUS", "BIKE"]).optional(),
  maxLoadKg: z.number().positive().optional(),
  acquisitionCost: z.number().positive().optional(),
  odometer: z.number().nonnegative().optional(),
  region: z.string().optional(),
  // NOTE: status is intentionally excluded — managed only by business rules
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
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
    return success(vehicle);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    // Validate regNo uniqueness if it's being changed
    if (parsed.data.regNo) {
      const conflict = await prisma.vehicle.findFirst({
        where: { regNo: parsed.data.regNo, NOT: { id: params.id } },
      });
      if (conflict) {
        return failure(`Vehicle with regNo '${parsed.data.regNo}' already exists.`, 409);
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return success(vehicle);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            trips: { where: { status: { in: ["DRAFT", "DISPATCHED"] } } },
          },
        },
      },
    });

    if (vehicle.status !== "AVAILABLE") {
      return failure(
        `Cannot delete vehicle with status '${vehicle.status}'. Only AVAILABLE vehicles can be deleted.`,
        400
      );
    }

    if (vehicle._count.trips > 0) {
      return failure(
        "Cannot delete vehicle with active DRAFT or DISPATCHED trips.",
        400
      );
    }

    await prisma.vehicle.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
