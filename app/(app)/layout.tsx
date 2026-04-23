export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark flex flex-col">

      {/* ── Top nav ── */}
      <header className="bg-navy border-b border-[rgba(255,255,255,0.08)] px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <a href="/dashboard" className="font-heading text-xl text-orange tracking-wide">
          calibrate.
        </a>
        <nav className="hidden sm:flex items-center gap-7">
          <a href="/dashboard" className="font-body text-sm text-muted hover:text-white transition">Dashboard</a>
          <a href="/study"     className="font-body text-sm text-muted hover:text-white transition">Study</a>
          <a href="/progress"  className="font-body text-sm text-muted hover:text-white transition">Progress</a>
          <a href="/profile"   className="font-body text-sm text-muted hover:text-white transition">Profile</a>
          <a href="/auth/signout" className="font-body text-sm text-muted hover:text-red transition">Sign out</a>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 px-4 py-6 pb-24 sm:pb-8 max-w-3xl mx-auto w-full">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-navy border-t border-[rgba(255,255,255,0.08)] flex">
        {[
          { href: '/dashboard',   label: 'Home',     icon: '🏠' },
          { href: '/study',       label: 'Study',    icon: '📚' },
          { href: '/progress',    label: 'Progress', icon: '📊' },
          { href: '/profile',     label: 'Profile',  icon: '👤' },
        ].map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-muted hover:text-white transition"
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="font-body text-[10px]">{label}</span>
          </a>
        ))}
      </nav>

    </div>
  )
}
