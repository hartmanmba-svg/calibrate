import { NextResponse } from "next/server";

export async function POST() {
  // TODO: generate CE certificate PDF + email via Resend
  return NextResponse.json({ ok: true });
}
