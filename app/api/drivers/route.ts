import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRoute, success, failure } from "@/lib/api";
import { DriverStatus } from "@prisma/client";

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNo: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.string().or(z.date()).transform((v) => new Date(v)),
  contact: z.string().min(10),
  safetyScore: z.number().min(0).max(100).default(100),
  status: z.nativeEnum(DriverStatus).default("AVAILABLE"),
});

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as DriverStatus | null;
    const today = new Date();

    const drivers = await prisma.driver.findMany({
      where: {
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
    });

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const annotated = drivers.map((d) => ({
      ...d,
      isExpired: d.licenseExpiry < today,
      expiringSoon: d.licenseExpiry >= today && d.licenseExpiry <= thirtyDaysLater,
    }));

    return success(annotated);
  });
}

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json();
    const parsed = driverSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parsed.error.issues.map((e: any) => e.message).join(", "), 400);
    }

    const data = parsed.data;

    const existing = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
    if (existing) {
      return failure(`Driver with license number ${data.licenseNo} already exists.`, 409);
    }

    const driver = await prisma.driver.create({ data });
    return success(driver, 201);
  });
}
