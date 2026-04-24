import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate that body has subscription.endpoint
  if (
    typeof body !== 'object' ||
    body === null ||
    !('subscription' in body) ||
    typeof (body as Record<string, unknown>).subscription !== 'object' ||
    (body as Record<string, unknown>).subscription === null ||
    typeof ((body as Record<string, unknown>).subscription as Record<string, unknown>).endpoint !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid subscription.endpoint' },
      { status: 400 }
    )
  }

  // Subscription received — storage to be implemented in a follow-up
  return NextResponse.json({ ok: true })
}
