'use client'

import { motion } from 'framer-motion'

const RADIUS = 52
const STROKE = 9
const SIZE = 140
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ringColor(score: number | null): string {
  if (score === null) return 'rgba(138,151,165,0.3)'
  if (score >= 80) return '#5DCAA5'
  if (score >= 60) return '#F4C430'
  return '#E24B4A'
}

function scoreLabel(score: number | null): string {
  if (score === null) return '—'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Developing'
  return 'Needs work'
}

export function ReadinessRing({
  score,
  reviewCount,
  label = 'OR Readiness',
}: {
  score: number | null
  reviewCount: number
  label?: string
}) {
  const color = ringColor(score)
  const dashOffset = score !== null
    ? CIRCUMFERENCE * (1 - score / 100)
    : CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE}
          />
          {/* Score arc */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.15 }}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {score !== null ? (
            <>
              <motion.span
                className="font-heading text-4xl text-white leading-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {score}
              </motion.span>
              <span className="font-body text-[11px] text-muted">/ 100</span>
            </>
          ) : (
            <span className="font-body text-xs text-muted text-center leading-tight px-3">
              {reviewCount < 10
                ? `${reviewCount} / 10\nreviews`
                : 'No data'}
            </span>
          )}
        </div>
      </div>

      {/* Label below ring */}
      <div className="text-center">
        <p className="font-heading text-lg text-white">{label}</p>
        <p className="font-body text-xs mt-0.5" style={{ color }}>
          {score !== null ? scoreLabel(score) : 'Not enough data yet'}
        </p>
        <p className="font-body text-[11px] text-muted mt-1">
          {reviewCount >= 10
            ? `${reviewCount} reviews · last 30 days`
            : `Need ${10 - reviewCount} more review${10 - reviewCount === 1 ? '' : 's'} to unlock`}
        </p>
      </div>
    </div>
  )
}
