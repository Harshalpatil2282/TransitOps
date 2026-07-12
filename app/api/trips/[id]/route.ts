import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { dispatchTrip, completeTrip, cancelTrip } from "@/lib/business-rules";

const actionSchema = z.object({
  action: z.enum(["dispatch", "complete", "cancel"]),
  actualOdometer: z.number().positive().optional(),
  fuelConsumed: z.number().positive().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        driver: true,
        fuelLogs: true,
        expenses: true,
      },
    });

    if (!trip) return failure("Trip not found", 404);
    return success(trip);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const { action, actualOdometer, fuelConsumed } = parsed.data;

    if (action === "dispatch") {
      await dispatchTrip(params.id);
    } else if (action === "complete") {
      if (!actualOdometer || !fuelConsumed) {
        return failure("actualOdometer and fuelConsumed are required to complete a trip.", 400);
      }
      await completeTrip(params.id, actualOdometer, fuelConsumed);
    } else if (action === "cancel") {
      await cancelTrip(params.id);
    }

    const updated = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { vehicle: true, driver: true },
    });

    return success(updated);
  }, 422);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip) return failure("Trip not found", 404);
    if (trip.status !== "DRAFT") {
      return failure("Only DRAFT trips can be deleted.", 400);
    }

    await prisma.trip.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
