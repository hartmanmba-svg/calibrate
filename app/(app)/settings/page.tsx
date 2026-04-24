import { createClient } from '@/lib/supabase/server'
import { PushNotificationToggle } from './components/PushNotificationToggle'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', uid)
    .maybeSingle()

  const email = profile?.email ?? user?.email ?? '—'

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Settings</h1>
        <p className="font-body text-sm text-muted mt-1">Manage your account and preferences.</p>
      </div>

      {/* Account section */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-muted uppercase tracking-widest">Account</p>
        <div className="flex flex-col gap-1">
          <p className="font-body text-xs text-muted">Email</p>
          <p className="font-body text-sm text-white">{email}</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted">Password</p>
          <p className="font-body text-sm text-muted mt-0.5">Change password — coming soon</p>
        </div>
      </section>

      {/* Notifications section */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-muted uppercase tracking-widest">Notifications</p>
        <PushNotificationToggle />
      </section>

      {/* Danger zone */}
      <section className="bg-navy border border-red/20 rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-red uppercase tracking-widest">Danger zone</p>
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-muted">
            Signing out will end your session on this device.
          </p>
          <a
            href="/auth/signout"
            className="self-start font-heading text-sm px-5 py-2 rounded-xl border border-red/40 text-red hover:bg-red/10 transition"
          >
            Sign out
          </a>
        </div>
      </section>

    </div>
  )
}
