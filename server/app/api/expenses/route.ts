import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional(),
  type: z.string().min(1),
  amount: z.number().positive(),
  date: z.coerce.date(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId") ?? undefined;

    const items = await prisma.expense.findMany({
      where: { ...(vehicleId ? { vehicleId } : {}) },
      include: { vehicle: true, trip: true },
      orderBy: { date: "desc" },
    });

    const totalAmount = items.reduce((s, e) => s + e.amount, 0);

    return success({ items, summary: { totalAmount } });
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const expense = await prisma.expense.create({
      data: parsed.data,
      include: { vehicle: true, trip: true },
    });

    return success(expense, 201);
  });
}
