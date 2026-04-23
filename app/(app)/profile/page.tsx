import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'
import type { CareerStage } from '@/lib/supabase/types'

export default async function ProfilePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  // No redirect — middleware handles unauthenticated users.
  const uid = user?.id ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, career_stage, xp, level, streak')
    .eq('id', uid)
    .maybeSingle()

  const fullName    = profile?.full_name    ?? null
  const careerStage = (profile?.career_stage ?? 'student') as CareerStage
  const xp          = profile?.xp          ?? 0
  const level       = profile?.level       ?? 1
  const streak      = profile?.streak      ?? 0

  return (
    <div className="space-y-8 max-w-md">

      {/* ── Header ── */}
      <div>
        <h1 className="font-heading text-3xl text-white">Profile</h1>
        <p className="font-body text-sm text-muted mt-1">Manage your account and career stage.</p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Level',  value: level,              color: 'text-teal' },
          { label: 'XP',     value: xp.toLocaleString(), color: 'text-white' },
          { label: 'Streak', value: `${streak} 🔥`,      color: 'text-orange' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-xl p-4 text-center">
            <p className={`font-heading text-2xl ${color}`}>{value}</p>
            <p className="font-body text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Edit form ── */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6">
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-5">
          Account details
        </h2>
        <ProfileForm
          email={user?.email ?? ''}
          fullName={fullName}
          careerStage={careerStage}
        />
      </section>

      {/* ── Sign out ── */}
      <div className="text-center">
        <a
          href="/auth/signout"
          className="font-body text-sm text-muted hover:text-red transition"
        >
          Sign out
        </a>
      </div>

    </div>
  )
}
