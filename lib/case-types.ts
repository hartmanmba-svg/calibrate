import type { CaseType } from '@/lib/supabase/types'

export const CASE_TYPES: CaseType[] = [
  'cervical', 'lumbar', 'scoliosis', 'carotid', 'vascular',
  'supratentorial', 'posterior_fossa', 'skull_base',
  'peripheral_nerve', 'spinal_tumor', 'tethered_cord', 'pediatric',
]

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  cervical:         'Cervical',
  lumbar:           'Lumbar',
  scoliosis:        'Scoliosis',
  carotid:          'Carotid',
  vascular:         'Vascular',
  supratentorial:   'Supratentorial',
  posterior_fossa:  'Posterior Fossa',
  skull_base:       'Skull Base',
  peripheral_nerve: 'Peripheral Nerve',
  spinal_tumor:     'Spinal Tumor',
  tethered_cord:    'Tethered Cord',
  pediatric:        'Pediatric',
}
