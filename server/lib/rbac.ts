import { Role } from "@prisma/client";

export type Permission =
  | "manage:vehicles"
  | "manage:drivers"
  | "manage:trips"
  | "manage:maintenance"
  | "view:finance"
  | "manage:finance"
  | "view:analytics"
  | "manage:settings";

const rolePermissions: Record<Role, Permission[]> = {
  FLEET_MANAGER: [
    "manage:vehicles",
    "manage:maintenance",
    "view:analytics",
    "manage:settings",
  ],
  DISPATCHER: ["manage:trips", "manage:drivers"],
  SAFETY_OFFICER: ["manage:drivers", "view:analytics"],
  FINANCIAL_ANALYST: ["view:finance", "manage:finance", "view:analytics"],
};

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
