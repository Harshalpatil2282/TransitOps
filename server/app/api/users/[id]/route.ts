import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const patchSchema = z.object({
  role: z.enum(["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]),
});

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

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return success(user);
  });
}
