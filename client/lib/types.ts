// ─── Enums ────────────────────────────────────────────────────────────────────
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
export type VehicleType = 'VAN' | 'TRUCK' | 'BUS' | 'BIKE'
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
export type MaintenanceStatus = 'ACTIVE' | 'CLOSED'
export type Role = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'

// ─── Core Models ──────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string
  regNo: string
  name: string
  type: VehicleType
  status: VehicleStatus
  maxLoadKg: number
  acquisitionCost: number
  odometer: number
  region: string | null
  createdAt: string
  updatedAt: string
  _count?: { trips: number }
}

export interface VehicleDetail extends Vehicle {
  maintenanceLogs: MaintenanceLog[]
  fuelLogs: FuelLog[]
  expenses: Expense[]
  trips: Trip[]
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
  updatedAt: string
  // Computed by backend annotateDriver()
  isExpired: boolean
  expiringSoon: boolean
}

export interface Trip {
  id: string
  source: string
  destination: string
  status: TripStatus
  scheduledAt: string | null
  dispatchedAt: string | null
  completedAt: string | null
  vehicleId: string
  driverId: string
  createdAt: string
  updatedAt: string
  vehicle?: Pick<Vehicle, 'id' | 'name' | 'regNo'>
  driver?: Pick<Driver, 'id' | 'name'>
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  serviceType: string
  date: string
  cost: number
  status: MaintenanceStatus
  notes: string | null
  createdAt: string
}

export interface FuelLog {
  id: string
  vehicleId: string
  date: string
  liters: number
  cost: number
  createdAt: string
}

export interface Expense {
  id: string
  vehicleId: string
  category: string
  amount: number
  description: string | null
  date: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
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
  vehicleStatusBreakdown: Array<{ status: VehicleStatus; count: number }>
}
