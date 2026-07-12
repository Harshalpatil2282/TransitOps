import { NextResponse } from "next/server";
import { ok, err } from "@/types";

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
    const msg: string = e?.message ?? "Internal server error";
    const status =
      msg.includes("not found") || msg.includes("No ")
        ? 404
        : msg.includes("already")
        ? 409
        : msg.includes("exceed") ||
          msg.includes("expired") ||
          msg.includes("not available") ||
          msg.includes("not eligible") ||
          msg.includes("Only ") ||
          msg.includes("cannot") ||
          msg.includes("SUSPENDED")
        ? 422
        : errorStatus;
    return failure(msg, status);
  }
}
