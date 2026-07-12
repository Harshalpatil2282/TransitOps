import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { Role } from "@prisma/client";

const updateSchema = z.object({
  role: z.nativeEnum(Role),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return failure("User not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.errors.map((e) => e.message).join(", "), 400);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return success(updated);
  });
}
