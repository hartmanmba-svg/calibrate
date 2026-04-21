import { NextResponse } from "next/server";

export async function POST() {
  // TODO: on-demand readiness score recalculation
  return NextResponse.json({ ok: true });
}
