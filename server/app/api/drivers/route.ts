import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNo: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.coerce.date(),
  contact: z.string().min(10),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).default("AVAILABLE"),
});

function annotateDriver(driver: any) {
  const today = new Date();
  const expiry = new Date(driver.licenseExpiry);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  return {
    ...driver,
    isExpired: expiry < today,
    expiringSoon: expiry >= today && expiry <= thirtyDays,
  };
}

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;

    const drivers = await prisma.driver.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return success(drivers.map(annotateDriver));
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = driverSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNo: parsed.data.licenseNo },
    });
    if (existing) {
      return failure(
        `Driver with license number '${parsed.data.licenseNo}' already exists.`,
        409
      );
    }

    const driver = await prisma.driver.create({ data: parsed.data });
    return success(annotateDriver(driver), 201);
  });
}
