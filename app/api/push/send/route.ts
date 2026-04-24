import { NextResponse } from 'next/server'

// Internal-use placeholder — full delivery requires VAPID keys configured
// in environment variables and a web-push library integration.

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).title !== 'string' ||
    typeof (body as Record<string, unknown>).body !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Body must include title: string and body: string' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    note: 'Push delivery not yet implemented — VAPID keys required',
  })
}
