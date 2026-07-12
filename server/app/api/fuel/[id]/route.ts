import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRoute, success } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRoute(async () => {
    await prisma.fuelLog.delete({ where: { id: params.id } });
    return success({ deleted: true });
  });
}
