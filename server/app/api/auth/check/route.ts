import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

// POST /api/auth/check — used by the client app to validate credentials
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { email, password } = await req.json();
    if (!email || !password) return failure("Missing credentials", 400);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return failure("Invalid credentials", 401);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return failure("Invalid credentials", 401);
    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });
}
