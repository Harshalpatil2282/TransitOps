import { prisma } from "./prisma";

export async function dispatchTrip(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (trip.status !== "DRAFT")
    throw new Error("Only DRAFT trips can be dispatched.");

  if (trip.vehicle.status !== "AVAILABLE")
    throw new Error(
      `Vehicle ${trip.vehicle.regNo} is not available (${trip.vehicle.status}).`
    );

  if (trip.driver.status !== "AVAILABLE")
    throw new Error(
      `Driver ${trip.driver.name} is not available (${trip.driver.status}).`
    );

  if (new Date(trip.driver.licenseExpiry) < new Date())
    throw new Error(
      `Driver ${trip.driver.name} has an expired license.`
    );

  if (trip.cargoWeightKg > trip.vehicle.maxLoadKg)
    throw new Error(
      `Cargo ${trip.cargoWeightKg}kg exceeds vehicle capacity ${trip.vehicle.maxLoadKg}kg.`
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
      data: { status: "AVAILABLE" },
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

  const updates: Parameters<typeof prisma.$transaction>[0] = [
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    }),
  ];

  if (trip.status === "DISPATCHED") {
    updates.push(
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

  await prisma.$transaction(updates);
}

export async function openMaintenance(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
  });

  if (vehicle.status === "RETIRED")
    throw new Error("Retired vehicles cannot have active maintenance.");

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

  const updates: Parameters<typeof prisma.$transaction>[0] = [
    prisma.maintenanceLog.update({
      where: { id: maintenanceId },
      data: { status: "CLOSED" },
    }),
  ];

  if (log.vehicle.status !== "RETIRED") {
    updates.push(
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: "AVAILABLE" },
      })
    );
  }

  await prisma.$transaction(updates);
}
