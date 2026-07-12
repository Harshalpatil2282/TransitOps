import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Unauthorized. Please sign in first." },
    { status: 401 }
  );
}
