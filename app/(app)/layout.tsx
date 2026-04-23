import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './components/SignOutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Belt-and-suspenders: middleware should catch this, but guard here too
  if (!user) redirect('/login')

  // Subscription status — drives the upgrade banner
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', user.id)
    .maybeSingle()

  const isActive =
    subscription?.status === 'active' ||
    subscription?.status === 'trialing'

  return (
    <div className="min-h-screen bg-dark flex flex-col">

      {/* Upgrade banner — free / expired / past-due users only */}
      {!isActive && (
        <div className="bg-gold/10 border-b border-gold/20 py-2 px-4 text-center">
          <p className="font-body text-xs text-gold">
            {subscription?.status === 'past_due'
              ? 'Your payment failed — '
              : "You're on the free plan — "}
            <Link href="/pricing" className="underline hover:text-white transition">
              {subscription?.status === 'past_due'
                ? 'update your payment method →'
                : 'upgrade to unlock all features →'}
            </Link>
          </p>
        </div>
      )}

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
            <Link href="/dashboard" className="font-body text-sm text-muted hover:text-white transition">Dashboard</Link>
            <Link href="/study"     className="font-body text-sm text-muted hover:text-white transition">Study</Link>
            <Link href="/progress"  className="font-body text-sm text-muted hover:text-white transition">Progress</Link>
            <Link href="/profile"   className="font-body text-sm text-muted hover:text-white transition">Profile</Link>
          </nav>

          <SignOutButton />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-navy border-t border-[rgba(255,255,255,0.10)] z-40">
        <div className="grid grid-cols-4 h-16">
          <Link href="/dashboard" className="flex flex-col items-center justify-center gap-0.5 text-muted hover:text-white transition">
            <span className="font-body text-xs">Dashboard</span>
          </Link>
          <Link href="/study"     className="flex flex-col items-center justify-center gap-0.5 text-muted hover:text-white transition">
            <span className="font-body text-xs">Study</span>
          </Link>
          <Link href="/progress"  className="flex flex-col items-center justify-center gap-0.5 text-muted hover:text-white transition">
            <span className="font-body text-xs">Progress</span>
          </Link>
          <Link href="/profile"   className="flex flex-col items-center justify-center gap-0.5 text-muted hover:text-white transition">
            <span className="font-body text-xs">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Spacer so content isn't obscured by the fixed mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  )
}
