'use client'

type Props = {
  feature: string
  description?: string
}

export function UpgradePrompt({ feature, description }: Props) {
  return (
    <div className="rounded-2xl border border-orange/40 bg-dark flex flex-col items-center gap-4 px-6 py-8 text-center">
      {/* Lock icon */}
      <div className="w-12 h-12 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-orange"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      {/* Feature name */}
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg text-white">{feature}</p>
        {description && (
          <p className="font-body text-sm text-muted max-w-xs">{description}</p>
        )}
      </div>

      {/* CTA */}
      <a
        href="/pricing"
        className="font-heading text-sm px-6 py-2.5 rounded-xl bg-orange hover:bg-orange/90 text-white transition"
      >
        Upgrade to unlock
      </a>
    </div>
  )
}
