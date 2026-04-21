import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  // TODO: serve public profile data for share_links token (unauthenticated)
  return NextResponse.json({ token: params.token });
}
