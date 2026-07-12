import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().optional(),
  type: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().or(z.date()).transform((v) => new Date(v)),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const [expenses, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where: { ...(vehicleId && { vehicleId }) },
        include: { vehicle: true, trip: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.aggregate({
        where: { ...(vehicleId && { vehicleId }) },
        _sum: { amount: true },
      }),
    ]);

    return success({
      items: expenses,
      summary: {
        totalAmount: aggregate._sum.amount ?? 0,
      },
    });
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.issues.map((e: any) => e.message).join(", "), 400);
    }

    const expense = await prisma.expense.create({
      data: parsed.data,
      include: { vehicle: true, trip: true },
    });

    return success(expense, 201);
  });
}
