import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Stale-cookie cleanup
// ----------------------------------------------------------------

// When a Supabase project is replaced the old auth cookies (keyed on the old
// project ref) linger in the browser and confuse getUser() — it sees two
// competing sb-* tokens and can fail to resolve the session.  Delete any
// cookie whose name starts with the OLD project ref on every response so
// users never need to manually clear cookies after a project switch.
const STALE_COOKIE_PREFIX = 'sb-ccyocwksaqmaszezmwiu'

function purgeStale(
  request: NextRequest,
  response: NextResponse,
): void {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(STALE_COOKIE_PREFIX)) {
      response.cookies.delete(name)
    }
  })
}

// ----------------------------------------------------------------
// Route classification
// ----------------------------------------------------------------

// Require an authenticated session
const PROTECTED_PATHS = [
  '/dashboard',
  '/study',
  '/progress',
  '/resources',
  '/ce-credits',
  '/profile',
  '/settings',
  '/employer',
]

// Already-signed-in users are bounced to /dashboard
const AUTH_PATHS = ['/login', '/signup', '/onboarding']
const PUBLIC_PATHS = ['/auth', '/api']

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthPage(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// ----------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Build the Supabase response that will carry refreshed cookies.
  //       Per @supabase/ssr docs, supabaseResponse MUST be the object
  //       returned (or its cookies copied to any redirect response).
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Step 1 — write back onto the request so subsequent server
          //           code within this request sees the updated cookies.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2 — rebuild supabaseResponse so it carries the new
          //           Set-Cookie headers to the browser.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── 2. Check for an active session.
  //       getSession() reads from the cookie without a network round-trip,
  //       so it returns consistently even when the access token is mid-refresh.
  //       Pages that need hard security still call getUser() themselves.
  let user = null
  try {
    const { data } = await supabase.auth.getSession()
    user = data.session?.user ?? null
  } catch {
    // Misconfiguration — pass through so /login renders rather than looping.
    return supabaseResponse
  }

  // ── 3. Route guards ──────────────────────────────────────────────

  // Unauthenticated user → protected route: send to login
  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      redirectResponse.cookies.set(name, value, opts)
    )
    purgeStale(request, redirectResponse)
    return redirectResponse
  }

  // Authenticated user → auth page: send to dashboard
  if (user && isAuthPage(pathname)) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.searchParams.delete('next')
    const redirectResponse = NextResponse.redirect(dashboardUrl)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      redirectResponse.cookies.set(name, value, opts)
    )
    purgeStale(request, redirectResponse)
    return redirectResponse
  }

  purgeStale(request, supabaseResponse)
  return supabaseResponse
}

// ----------------------------------------------------------------
// Matcher — exclude static files, images, and auth callback
// ----------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static chunk files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public assets (svg, png, jpg, jpeg, gif, webp)
     * - /auth/callback (Supabase OAuth / magic-link exchange — must
     *   process the code before getUser() will succeed)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
