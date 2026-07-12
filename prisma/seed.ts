import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  console.log("🌱 Seeding database...");

  // Users (all 4 roles)
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

  console.log("✅ Users seeded");

  // Vehicles
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

  console.log("✅ Vehicles seeded");

  // Drivers
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
      where: { licenseNo: "DL-55730" },
      update: {},
      create: {
        name: "Priya Singh",
        licenseNo: "DL-55730",
        licenseCategory: "LMV",
        licenseExpiry: new Date("2025-03-10"), // expired for demo
        contact: "9876543212",
        safetyScore: 76,
        status: "OFF_DUTY",
      },
    }),
  ]);

  console.log("✅ Drivers seeded");

  // A completed trip for analytics data
  const trip1 = await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeightKg: 450,
      plannedDistanceKm: 150,
      status: "COMPLETED",
      actualOdometer: 12550,
      fuelConsumed: 18,
      revenue: 8500,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Jaipur",
      vehicleId: truck8.id,
      driverId: sam.id,
      cargoWeightKg: 2800,
      plannedDistanceKm: 280,
      status: "COMPLETED",
      actualOdometer: 45480,
      fuelConsumed: 62,
      revenue: 32000,
    },
  });

  const trip3 = await prisma.trip.create({
    data: {
      source: "Bangalore",
      destination: "Chennai",
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeightKg: 300,
      plannedDistanceKm: 345,
      status: "DRAFT",
      revenue: 15000,
    },
  });

  console.log("✅ Trips seeded");

  // Fuel logs
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
        date: new Date("2026-05-15"),
      },
      {
        vehicleId: van05.id,
        liters: 22,
        cost: 2860,
        date: new Date("2026-05-20"),
      },
    ],
  });

  console.log("✅ Fuel logs seeded");

  // Maintenance log for bus (already IN_SHOP)
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: ag10.id,
      serviceType: "Engine Repair",
      cost: 18000,
      date: new Date("2026-06-01"),
      status: "ACTIVE",
      notes: "Major engine overhaul required",
    },
  });

  // Closed maintenance for van
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van05.id,
      serviceType: "Oil Change",
      cost: 2500,
      date: new Date("2026-05-01"),
      status: "CLOSED",
      notes: "Regular 5000km service",
    },
  });

  console.log("✅ Maintenance logs seeded");

  // Expenses
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
        type: "Toll",
        amount: 680,
        date: new Date("2026-06-08"),
        notes: "Delhi-Jaipur highway toll",
      },
      {
        vehicleId: van05.id,
        type: "Parking",
        amount: 200,
        date: new Date("2026-06-09"),
        notes: "Overnight parking",
      },
    ],
  });

  console.log("✅ Expenses seeded");
  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("   fleet@transitops.com     / password123  (Fleet Manager)");
  console.log("   dispatch@transitops.com  / password123  (Dispatcher)");
  console.log("   safety@transitops.com    / password123  (Safety Officer)");
  console.log("   finance@transitops.com   / password123  (Financial Analyst)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
