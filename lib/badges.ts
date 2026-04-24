// ----------------------------------------------------------------
// Badge definitions — single source of truth
// ----------------------------------------------------------------

export type BadgeKey =
  | 'first_review'
  | 'streak_7'
  | 'streak_30'
  | 'speed_run'
  | 'sharp_eye'
  | 'night_owl'
  | 'early_bird'
  | 'spinal_specialist'
  | 'centurion'
  | 'cnim_ready'

export type BadgeDefinition = {
  key: BadgeKey
  label: string
  description: string
  icon: string
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'first_review',
    label: 'First Review',
    description: 'Complete your first review',
    icon: '⚡',
  },
  {
    key: 'streak_7',
    label: '7-Day Streak',
    description: 'Reach a 7-day streak',
    icon: '🔥',
  },
  {
    key: 'streak_30',
    label: '30-Day Streak',
    description: 'Reach a 30-day streak',
    icon: '🏆',
  },
  {
    key: 'speed_run',
    label: 'Speed Run',
    description: 'Review 20 cards in one session',
    icon: '⚡',
  },
  {
    key: 'sharp_eye',
    label: 'Sharp Eye',
    description: '10 Got it ratings in a row',
    icon: '🎯',
  },
  {
    key: 'night_owl',
    label: 'Night Owl',
    description: 'Review after 10pm local time',
    icon: '🦉',
  },
  {
    key: 'early_bird',
    label: 'Early Bird',
    description: 'Review before 7am local time',
    icon: '🌅',
  },
  {
    key: 'spinal_specialist',
    label: 'Spinal Specialist',
    description: 'Spinal score above 80',
    icon: '🦴',
  },
  {
    key: 'centurion',
    label: 'Centurion',
    description: 'Complete 100 total reviews',
    icon: '💯',
  },
  {
    key: 'cnim_ready',
    label: 'CNIM Ready',
    description: 'OR Readiness above 75',
    icon: '🏅',
  },
]
