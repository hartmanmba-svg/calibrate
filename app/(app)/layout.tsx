import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// ----------------------------------------------------------------
// Nav items
// ----------------------------------------------------------------

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     icon: '⊞' },
  { href: '/study',     label: 'Study',    icon: '⚡' },
  { href: '/progress',  label: 'Progress', icon: '📈' },
  { href: '/profile',   label: 'Profile',  icon: '👤' },
  { href: '/settings',  label: 'Settings', icon: '⚙️' },
] as const

// ----------------------------------------------------------------
// Layout
// ----------------------------------------------------------------

export default async function AppLayout({ children }: { children: ReactNode }) {
  // ── Onboarding gate ───────────────────────────────────────────
  // Read the current pathname from the x-pathname header injected
  // by middleware (or fall back to the referer) to avoid redirect
  // loops when the user is already on /onboarding.
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''

  if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/checkout')) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('career_stage')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || !profile.career_stage) {
        redirect('/onboarding')
      }
    }
  }
  return (
    <div className="min-h-screen bg-dark flex flex-col">

      {/* ── Top nav (desktop) ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#1A252F] border-b border-[rgba(255,255,255,0.08)] shrink-0">
        {/* Logo */}
        <a href="/dashboard" className="font-heading text-xl font-semibold text-orange tracking-tight">
          calibrate.
        </a>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="font-heading text-sm text-muted hover:text-white transition uppercase tracking-wider"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Sign out */}
        <a
          href="/auth/signout"
          className="font-body text-sm text-muted hover:text-red transition"
        >
          Sign out
        </a>
      </header>

      {/* ── Mobile top bar ── */}
      <header className="flex md:hidden items-center justify-between px-5 py-4 bg-[#1A252F] border-b border-[rgba(255,255,255,0.08)] shrink-0">
        <a href="/dashboard" className="font-heading text-lg font-semibold text-orange">
          calibrate.
        </a>
        <a
          href="/auth/signout"
          className="font-body text-xs text-muted hover:text-red transition"
        >
          Sign out
        </a>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#1A252F] border-t border-[rgba(255,255,255,0.08)] flex">
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 font-body text-[10px] text-muted hover:text-white transition"
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="uppercase tracking-wider">{label}</span>
          </a>
        ))}
      </nav>

    </div>
  )
}
