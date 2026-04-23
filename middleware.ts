import { NextResponse, type NextRequest } from 'next/server'

// DIAGNOSTIC: middleware completely disabled — passes every request through.
// If pages render with this, the Supabase client construction in middleware
// was crashing (env vars missing/wrong in Edge Runtime) and returning empty 500.

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
