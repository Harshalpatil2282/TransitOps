import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  console.log("🌱 Seeding database...");

  // ── Users (all 4 roles) ────────────────────────────────────────────────────
  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        email: "fleet@transitops.com",
        passwordHash: await hash("password123"),
        name: "Fleet Manager",
        role: "FLEET_MANAGER",
      },
      {
        email: "dispatch@transitops.com",
        passwordHash: await hash("password123"),
        name: "Dispatcher",
        role: "DISPATCHER",
      },
      {
        email: "safety@transitops.com",
        passwordHash: await hash("password123"),
        name: "Safety Officer",
        role: "SAFETY_OFFICER",
      },
      {
        email: "finance@transitops.com",
        passwordHash: await hash("password123"),
        name: "Financial Analyst",
        role: "FINANCIAL_ANALYST",
      },
    ],
  });
  console.log("  ✅ Users created");

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const [van05, truck8, ag10, bike01] = await Promise.all([
    prisma.vehicle.upsert({
      where: { regNo: "VAN-05" },
      update: {},
      create: {
        regNo: "VAN-05",
        name: "Van Alpha",
        type: "VAN",
        maxLoadKg: 500,
        acquisitionCost: 850000,
        odometer: 12400,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNo: "TRUCK-8" },
      update: {},
      create: {
        regNo: "TRUCK-8",
        name: "Truck Bravo",
        type: "TRUCK",
        maxLoadKg: 3000,
        acquisitionCost: 2400000,
        odometer: 45200,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNo: "AG10-DV" },
      update: {},
      create: {
        regNo: "AG10-DV",
        name: "Bus Charlie",
        type: "BUS",
        maxLoadKg: 800,
        acquisitionCost: 1800000,
        odometer: 98000,
        status: "IN_SHOP",
        region: "South",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNo: "BIKE-01" },
      update: {},
      create: {
        regNo: "BIKE-01",
        name: "Bike Delta",
        type: "BIKE",
        maxLoadKg: 50,
        acquisitionCost: 120000,
        odometer: 3200,
        status: "AVAILABLE",
        region: "East",
      },
    }),
  ]);
  console.log("  ✅ Vehicles created");

  // ── Drivers ────────────────────────────────────────────────────────────────
  const [alex, sam, priya] = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNo: "DL-44901" },
      update: {},
      create: {
        name: "Alex Kumar",
        licenseNo: "DL-44901",
        licenseCategory: "LMV",
        licenseExpiry: new Date("2027-06-01"),
        contact: "9876543210",
        safetyScore: 94,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.upsert({
      where: { licenseNo: "DL-33902" },
      update: {},
      create: {
        name: "Sam Patel",
        licenseNo: "DL-33902",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2026-09-15"),
        contact: "9876543211",
        safetyScore: 88,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.upsert({
      where: { licenseNo: "DL-55023" },
      update: {},
      create: {
        name: "Priya Singh",
        licenseNo: "DL-55023",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2025-03-01"), // EXPIRED — for safety testing
        contact: "9876543212",
        safetyScore: 76,
        status: "AVAILABLE",
      },
    }),
  ]);
  console.log("  ✅ Drivers created");

  // ── Completed Trip (for analytics data) ────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeightKg: 450,
      plannedDistanceKm: 150,
      revenue: 8500,
      status: "COMPLETED",
      actualOdometer: 12550,
      fuelConsumed: 18,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Chandigarh",
      vehicleId: truck8.id,
      driverId: sam.id,
      cargoWeightKg: 2800,
      plannedDistanceKm: 260,
      revenue: 22000,
      status: "COMPLETED",
      actualOdometer: 45460,
      fuelConsumed: 62,
    },
  });

  // Draft trip
  await prisma.trip.create({
    data: {
      source: "Bangalore",
      destination: "Chennai",
      vehicleId: bike01.id,
      driverId: alex.id,
      cargoWeightKg: 40,
      plannedDistanceKm: 360,
      revenue: 3200,
      status: "DRAFT",
    },
  });
  console.log("  ✅ Trips created");

  // ── Fuel Logs ──────────────────────────────────────────────────────────────
  await prisma.fuelLog.createMany({
    data: [
      {
        vehicleId: van05.id,
        tripId: trip1.id,
        liters: 18,
        cost: 2340,
        date: new Date("2026-06-10"),
      },
      {
        vehicleId: truck8.id,
        tripId: trip2.id,
        liters: 62,
        cost: 8060,
        date: new Date("2026-06-08"),
      },
      {
        vehicleId: truck8.id,
        liters: 40,
        cost: 5200,
        date: new Date("2026-05-20"),
      },
    ],
  });
  console.log("  ✅ Fuel logs created");

  // ── Maintenance Log ────────────────────────────────────────────────────────
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: ag10.id,
      serviceType: "Engine Repair",
      cost: 18000,
      date: new Date("2026-06-01"),
      status: "ACTIVE",
      notes: "Major overhaul — crankshaft replacement",
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van05.id,
      serviceType: "Oil Change",
      cost: 1200,
      date: new Date("2026-05-15"),
      status: "CLOSED",
      notes: "Routine oil change at 12,000 km",
    },
  });
  console.log("  ✅ Maintenance logs created");

  // ── Expenses ───────────────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      {
        vehicleId: van05.id,
        tripId: trip1.id,
        type: "Toll",
        amount: 340,
        date: new Date("2026-06-10"),
        notes: "Mumbai-Pune expressway toll",
      },
      {
        vehicleId: truck8.id,
        tripId: trip2.id,
        type: "Bridge Fee",
        amount: 520,
        date: new Date("2026-06-08"),
      },
      {
        vehicleId: van05.id,
        type: "Parking",
        amount: 200,
        date: new Date("2026-06-09"),
      },
    ],
  });
  console.log("  ✅ Expenses created");

  console.log("\n✅ Seed complete!");
  console.log("\n📧 Login credentials (password: password123):");
  console.log("  fleet@transitops.com      → Fleet Manager");
  console.log("  dispatch@transitops.com   → Dispatcher");
  console.log("  safety@transitops.com     → Safety Officer");
  console.log("  finance@transitops.com    → Financial Analyst");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
