import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  licenseCategory: z.string().min(1).optional(),
  licenseExpiry: z.coerce.date().optional(),
  contact: z.string().min(10).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});

function annotateDriver(driver: any) {
  const today = new Date();
  const expiry = new Date(driver.licenseExpiry);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  return {
    ...driver,
    isExpired: expiry < today,
    expiringSoon: expiry >= today && expiry <= thirtyDays,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const driver = await prisma.driver.findUniqueOrThrow({
      where: { id: params.id },
      include: { trips: { orderBy: { createdAt: "desc" } } },
    });
    return success(annotateDriver(driver));
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

    // Validate licenseNo uniqueness if changing
    if (parsed.data.licenseNo) {
      const conflict = await prisma.driver.findFirst({
        where: { licenseNo: parsed.data.licenseNo, NOT: { id: params.id } },
      });
      if (conflict) {
        return failure(
          `Driver with license number '${parsed.data.licenseNo}' already exists.`,
          409
        );
      }
    }

    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return success(annotateDriver(driver));
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    const driver = await prisma.driver.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            trips: { where: { status: { in: ["DRAFT", "DISPATCHED"] } } },
          },
        },
      },
    });

    if (driver.status !== "AVAILABLE") {
      return failure(
        `Cannot delete driver with status '${driver.status}'. Only AVAILABLE drivers can be deleted.`,
        400
      );
    }

    if (driver._count.trips > 0) {
      return failure(
        "Cannot delete driver with active DRAFT or DISPATCHED trips.",
        400
      );
    }

    await prisma.driver.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
