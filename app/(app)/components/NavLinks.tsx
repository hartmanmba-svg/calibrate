'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/study',     label: 'Study' },
  { href: '/progress',  label: 'Progress' },
  { href: '/profile',   label: 'Profile' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`font-body text-sm transition ${
                active ? 'text-white' : 'text-muted hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-navy border-t border-[rgba(255,255,255,0.10)] z-40">
        <div className="grid grid-cols-4 h-16">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 transition ${
                  active ? 'text-orange' : 'text-muted hover:text-white'
                }`}
              >
                <span className="font-body text-xs">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
