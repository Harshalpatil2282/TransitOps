import { prisma } from "./prisma";

// ─── TRIP STATE MACHINE ──────────────────────────────────────────────────────

export async function dispatchTrip(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (trip.status !== "DRAFT")
    throw new Error("Only DRAFT trips can be dispatched.");

  if (trip.vehicle.status !== "AVAILABLE")
    throw new Error(
      `Vehicle ${trip.vehicle.regNo} is not available (current: ${trip.vehicle.status}).`
    );

  if (trip.driver.status !== "AVAILABLE")
    throw new Error(
      `Driver ${trip.driver.name} is not available (current status: ${trip.driver.status}). SUSPENDED drivers cannot be dispatched.`
    );

  if (new Date(trip.driver.licenseExpiry) < new Date())
    throw new Error(
      `Driver ${trip.driver.name} has an expired license (expired ${trip.driver.licenseExpiry.toDateString()}).`
    );

  if (trip.cargoWeightKg > trip.vehicle.maxLoadKg)
    throw new Error(
      `Cargo ${trip.cargoWeightKg}kg exceeds vehicle capacity of ${trip.vehicle.maxLoadKg}kg.`
    );

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED" },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "ON_TRIP" },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: "ON_TRIP" },
    }),
  ]);
}

export async function completeTrip(
  tripId: string,
  actualOdometer: number,
  fuelConsumed: number
) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
  });

  if (trip.status !== "DISPATCHED")
    throw new Error("Only DISPATCHED trips can be completed.");

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "COMPLETED", actualOdometer, fuelConsumed },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometer: actualOdometer },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    }),
  ]);
}

export async function cancelTrip(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
  });

  if (!["DRAFT", "DISPATCHED"].includes(trip.status))
    throw new Error("Only DRAFT or DISPATCHED trips can be cancelled.");

  const ops: any[] = [
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    }),
  ];

  if (trip.status === "DISPATCHED") {
    ops.push(
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE" },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      })
    );
  }

  await prisma.$transaction(ops);
}

// ─── MAINTENANCE STATE MACHINE ───────────────────────────────────────────────

export async function openMaintenance(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
  });

  if (vehicle.status === "RETIRED")
    throw new Error("Retired vehicles cannot be sent to maintenance.");

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: "IN_SHOP" },
  });
}

export async function closeMaintenance(maintenanceId: string) {
  const log = await prisma.maintenanceLog.findUniqueOrThrow({
    where: { id: maintenanceId },
    include: { vehicle: true },
  });

  if (log.status === "CLOSED")
    throw new Error("Maintenance record is already closed.");

  const ops: any[] = [
    prisma.maintenanceLog.update({
      where: { id: maintenanceId },
      data: { status: "CLOSED" },
    }),
  ];

  // Only restore to AVAILABLE if vehicle is still IN_SHOP (not RETIRED or ON_TRIP)
  if (log.vehicle.status === "IN_SHOP") {
    ops.push(
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: "AVAILABLE" },
      })
    );
  }

  await prisma.$transaction(ops);
}
