import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const log = await prisma.fuelLog.findUnique({ where: { id: params.id } });
    if (!log) return failure("Fuel log not found", 404);

    await prisma.fuelLog.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
