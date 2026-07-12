// Shared TypeScript types mirroring Prisma models

export type Role = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
export type VehicleType = 'VAN' | 'TRUCK' | 'BUS' | 'BIKE'
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
export type MaintenanceStatus = 'ACTIVE' | 'CLOSED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
}

export interface Vehicle {
  id: string
  regNo: string
  name: string
  type: VehicleType
  maxLoadKg: number
  odometer: number
  acquisitionCost: number
  status: VehicleStatus
  region?: string
  createdAt: string
  _count?: { trips: number }
}

export interface Driver {
  id: string
  name: string
  licenseNo: string
  licenseCategory: string
  licenseExpiry: string
  contact: string
  safetyScore: number
  status: DriverStatus
  createdAt: string
  isExpired?: boolean
  expiringSoon?: boolean
}

export interface Trip {
  id: string
  source: string
  destination: string
  vehicleId: string
  driverId: string
  cargoWeightKg: number
  plannedDistanceKm: number
  revenue: number
  status: TripStatus
  actualOdometer?: number
  fuelConsumed?: number
  createdAt: string
  updatedAt: string
  vehicle?: Vehicle
  driver?: Driver
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  serviceType: string
  cost: number
  date: string
  status: MaintenanceStatus
  notes?: string
  createdAt: string
}

export interface FuelLog {
  id: string
  vehicleId: string
  tripId?: string
  liters: number
  cost: number
  date: string
  createdAt: string
}

export interface Expense {
  id: string
  vehicleId: string
  tripId?: string
  type: string
  amount: number
  date: string
  notes?: string
  createdAt: string
}

export interface DashboardData {
  kpis: {
    activeVehicles: number
    availableVehicles: number
    inMaintenance: number
    activeTrips: number
    pendingTrips: number
    driversOnDuty: number
    fleetUtilization: number
    totalVehicles: number
  }
  recentTrips: Trip[]
  vehicleStatusBreakdown: { status: VehicleStatus; count: number }[]
}

export interface VehicleDetail extends Vehicle {
  maintenanceLogs: MaintenanceLog[]
  fuelLogs: FuelLog[]
  expenses: Expense[]
  trips: Trip[]
}
