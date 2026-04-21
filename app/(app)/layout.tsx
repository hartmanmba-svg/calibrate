import Link from 'next/link'
import { SignOutButton } from './components/SignOutButton'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/study',     label: 'Study' },
  { href: '/progress',  label: 'Progress' },
  { href: '/profile',   label: 'Profile' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Top nav */}
      <header className="bg-navy border-b border-[rgba(255,255,255,0.10)] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard">
            <span className="font-heading font-semibold text-2xl text-orange tracking-tight">
              calibrate.
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm text-muted hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <SignOutButton />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-navy border-t border-[rgba(255,255,255,0.10)] z-40">
        <div className="grid grid-cols-4 h-16">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-0.5 text-muted hover:text-white transition"
            >
              <span className="font-body text-xs">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom nav spacer on mobile */}
      <div className="h-16 md:hidden" />
    </div>
  )
}
