import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileForm } from './ProfileForm'
import { ProfilePrivacyForm } from './ProfilePrivacyForm'
import { CopyLinkButton } from './CopyLinkButton'
import type { CareerStage } from '@/lib/supabase/types'

export default async function ProfilePage() {
  const supabase = createClient()
  const admin = createAdminClient()

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

  // Fetch or create share link — use admin client to avoid RLS insert issues
  let shareToken: string | null = null
  let showName = true
  let showScores = true
  let showCredentials = true
  let showBadges = true

  if (uid) {
    const { data: existingLink } = await admin
      .from('share_links')
      .select('token, show_name, show_scores, show_credentials, show_badges')
      .eq('user_id', uid)
      .maybeSingle()

    if (existingLink) {
      shareToken        = existingLink.token
      showName        = existingLink.show_name
      showScores      = existingLink.show_scores
      showCredentials = existingLink.show_credentials
      showBadges      = existingLink.show_badges
    } else {
      // Auto-create on first visit
      const { data: newLink } = await admin
        .from('share_links')
        .insert({ user_id: uid })
        .select('token, show_name, show_scores, show_credentials, show_badges')
        .maybeSingle()
      if (newLink) {
        shareToken        = newLink.token
        showName        = newLink.show_name
        showScores      = newLink.show_scores
        showCredentials = newLink.show_credentials
        showBadges      = newLink.show_badges
      }
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicProfileUrl = shareToken ? `${appUrl}/p/${shareToken}` : null

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

      {/* ── Share Profile ── */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6">
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-2">
          Share profile
        </h2>
        <p className="font-body text-xs text-muted mb-5">
          Share a public link to your Calibrate profile card. Control what others can see below.
        </p>

        {publicProfileUrl ? (
          <div className="space-y-4">
            {/* Public URL display + copy */}
            <div className="flex items-center gap-3 bg-dark border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3">
              <span className="font-body text-xs text-muted flex-1 truncate">
                {publicProfileUrl}
              </span>
              <CopyLinkButton url={publicProfileUrl} />
            </div>

            {/* Privacy toggles */}
            <ProfilePrivacyForm
              showName={showName}
              showScores={showScores}
              showCredentials={showCredentials}
              showBadges={showBadges}
            />
          </div>
        ) : (
          <p className="font-body text-sm text-muted">
            Unable to generate share link. Please try refreshing.
          </p>
        )}
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
