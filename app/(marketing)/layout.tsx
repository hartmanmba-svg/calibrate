import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Nav */}
      <header className="bg-navy border-b border-[rgba(255,255,255,0.10)] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="font-heading font-semibold text-2xl text-orange tracking-tight">
              calibrate.
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-body text-sm text-muted hover:text-white transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-body text-sm bg-orange hover:bg-orange/90 text-white
                px-4 py-2 rounded-lg transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        {children}
      </main>

      <footer className="border-t border-[rgba(255,255,255,0.08)] py-8 text-center">
        <p className="font-body text-xs text-muted">
          © {new Date().getFullYear()} Calibrate. Sharpen your edge.
        </p>
      </footer>
    </div>
  )
}
