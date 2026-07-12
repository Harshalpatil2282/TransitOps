import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const expense = await prisma.expense.findUnique({ where: { id: params.id } });
    if (!expense) return failure("Expense not found", 404);

    await prisma.expense.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
