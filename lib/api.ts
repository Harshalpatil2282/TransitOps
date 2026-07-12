import { NextResponse } from "next/server";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function err(error: string): ApiResponse<never> {
  return { success: false, error };
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json(ok(data), { status });
}

export function failure(error: string, status = 400) {
  return NextResponse.json(err(error), { status });
}

export async function handleRoute(
  fn: () => Promise<NextResponse>,
  errorStatus = 500
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = e?.message ?? "Internal server error";
    const status =
      msg.toLowerCase().includes("not found") ? 404 :
      msg.toLowerCase().includes("already") || msg.toLowerCase().includes("unique") ? 409 :
      msg.toLowerCase().includes("exceed") || msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("not available") || msg.toLowerCase().includes("cannot") ||
      msg.toLowerCase().includes("suspended") || msg.toLowerCase().includes("only") ? 422 :
      errorStatus;
    return failure(msg, status);
  }
}
