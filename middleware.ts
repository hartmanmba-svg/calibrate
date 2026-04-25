import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Stale-cookie cleanup
// ----------------------------------------------------------------

const STALE_COOKIE_PREFIX = 'sb-ccyocwksaqmaszezmwiu'

function purgeStale(request: NextRequest, response: NextResponse): void {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(STALE_COOKIE_PREFIX)) {
      response.cookies.delete(name)
    }
  })
}

// ----------------------------------------------------------------
// Route classification
// ----------------------------------------------------------------

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

const AUTH_PATHS = ['/login', '/signup', '/onboarding']

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

  // ── Guard: if env vars are missing, pass through rather than crash.
  //    NEXT_PUBLIC_ vars are baked in at build time but may be absent
  //    in local dev or if Vercel env vars were not set before the build.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  // ── Build supabaseResponse — must be returned (or cookies copied) on
  //    every code path so Supabase can write refreshed session cookies.
  let supabaseResponse = NextResponse.next({ request })

  // ── Wrap the entire Supabase client construction + session check so
  //    any Edge Runtime error passes the request through rather than
  //    returning an empty 500.
  let user = null
  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data } = await supabase.auth.getSession()
    user = data.session?.user ?? null
  } catch {
    // Any error (network, bad env vars, Edge Runtime restriction) —
    // pass through and let pages handle their own auth state.
    return NextResponse.next()
  }

  // ── Route guards ─────────────────────────────────────────────────

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

  // Expose the current pathname as a request header so server layouts
  // can read it without re-parsing the URL from cookies or env vars.
  supabaseResponse.headers.set('x-pathname', pathname)

  purgeStale(request, supabaseResponse)
  return supabaseResponse
}

// ----------------------------------------------------------------
// Matcher
// ----------------------------------------------------------------

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/signout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
