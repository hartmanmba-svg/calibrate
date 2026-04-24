import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/employer/dashboard', label: 'Dashboard' },
  { href: '/employer/team',      label: 'Team' },
  { href: '/employer/reports',   label: 'Reports' },
] as const

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1A252F] flex flex-col">

      {/* ── Top nav ── */}
      <header className="flex items-center justify-between px-8 py-4 bg-[#1A252F] border-b border-[rgba(255,255,255,0.08)] shrink-0">
        {/* Logo */}
        <a href="/employer/dashboard" className="font-heading text-xl font-semibold text-orange tracking-tight">
          calibrate. <span className="text-muted text-sm font-body normal-case tracking-normal">employer</span>
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

      {/* ── Main content ── */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto">
        {children}
      </main>

    </div>
  )
}
