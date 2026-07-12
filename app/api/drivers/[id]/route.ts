import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  licenseCategory: z.string().min(1).optional(),
  licenseExpiry: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v))
    .optional(),
  contact: z.string().min(10).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        trips: {
          include: { vehicle: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!driver) return failure("Driver not found", 404);

    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return success({
      ...driver,
      isExpired: driver.licenseExpiry < today,
      expiringSoon: driver.licenseExpiry >= today && driver.licenseExpiry <= thirtyDaysLater,
    });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const driver = await prisma.driver.findUnique({ where: { id: params.id } });
    if (!driver) return failure("Driver not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const data = parsed.data;

    if (data.licenseNo && data.licenseNo !== driver.licenseNo) {
      const dup = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
      if (dup) return failure(`License number ${data.licenseNo} already in use.`, 409);
    }

    const updated = await prisma.driver.update({
      where: { id: params.id },
      data,
    });

    return success(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        trips: {
          where: { status: { in: ["DRAFT", "DISPATCHED"] } },
        },
      },
    });

    if (!driver) return failure("Driver not found", 404);
    if (driver.status !== "AVAILABLE") {
      return failure(`Cannot delete driver with status ${driver.status}. Only AVAILABLE drivers can be deleted.`, 400);
    }
    if (driver.trips.length > 0) {
      return failure("Cannot delete driver with active (DRAFT/DISPATCHED) trips.", 400);
    }

    await prisma.driver.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
