import { NextResponse } from "next/server";
import { client } from "@/lib/db/client";

/** Simple liveness + DB connectivity check for the deployed app. */
export async function GET() {
  try {
    await client.execute("SELECT 1");
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", database: "unreachable", message: error instanceof Error ? error.message : String(error) },
      { status: 503 },
    );
  }
}
