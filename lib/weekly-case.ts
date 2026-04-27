export type WeeklyCase = {
  id: string
  title: string
  week: string   // ISO week string like "2026-W17"
  specialty: string
  scenario: string
  question: string
  options: string[]   // 4 options
  correctIndex: number  // 0-based
  explanation: string
}

// ----------------------------------------------------------------
// Case bank — add new entries each week. The page auto-selects the
// entry matching the current ISO week; if none matches, the most
// recent entry is used so the page never goes blank.
// ----------------------------------------------------------------

const WEEKLY_CASES: WeeklyCase[] = [
  {
    id: 'case-2026-w17',
    week: '2026-W17',
    title: 'Intraoperative SSEP Loss',
    specialty: 'Spine — Cervical',
    scenario:
      'A 58-year-old patient undergoes anterior cervical discectomy and fusion at C5–C6. Forty minutes after incision, bilateral upper-extremity SSEP amplitude drops 55% with a 12% latency increase. MEPs remain intact. Blood pressure is stable at MAP 72 mmHg.',
    question:
      'What is the MOST likely cause of this isolated bilateral upper-extremity SSEP change with preserved MEPs?',
    options: [
      'Anterior spinal artery compromise',
      'Posterior column ischemia from surgical retraction or positioning',
      'Neuromuscular blockade effect',
      'Global anesthetic suppression',
    ],
    correctIndex: 1,
    explanation:
      'Isolated SSEP loss with preserved MEPs is the hallmark of posterior column compromise — the SSEP pathway (dorsal columns) is affected while the corticospinal tract (MEP pathway) is spared. Bilateral involvement suggests positioning or systemic cause. Anterior spinal artery compromise would abolish MEPs first. NMBAs abolish MEPs but spare SSEPs. Global anesthetic changes affect both modalities symmetrically.',
  },
  {
    id: 'case-2026-w18',
    week: '2026-W18',
    title: 'MEP Fade During Scoliosis Correction',
    specialty: 'Spine — Scoliosis',
    scenario:
      'During posterior spinal fusion for adolescent idiopathic scoliosis, bilateral lower-extremity MEPs are robust at baseline. After derotation of the rod, left lower-extremity MEP amplitude falls to 35% of baseline over two minutes. Right MEPs and all SSEPs remain stable. MAP is 68 mmHg.',
    question:
      'What is the FIRST intervention that should be recommended to the surgical team?',
    options: [
      'Discontinue inhalational anesthetic and switch to TIVA',
      'Increase MAP to ≥80 mmHg with a vasopressor',
      'Ask the surgeon to release or reverse the correction',
      'Perform a wake-up test immediately',
    ],
    correctIndex: 1,
    explanation:
      'Unilateral MEP loss following a derotation maneuver raises concern for vascular compromise (e.g., radiculomedullary artery stretch or cord ischemia). The first step is optimizing perfusion pressure — raising MAP to ≥80 mmHg is fast and reversible and often resolves monitoring changes. If the change persists or worsens after MAP augmentation, asking the surgeon to reverse the correction is the next step. Switching to TIVA may help if there is baseline anesthetic suppression but is not the first-line response to a new acute change. A wake-up test is reserved for persistent, unexplained changes after other interventions.',
  },
  {
    id: 'case-2026-w19',
    week: '2026-W19',
    title: 'Free-Run EMG Burst During Lumbar Dissection',
    specialty: 'Spine — Lumbar',
    scenario:
      'A 47-year-old undergoes L4–S1 PLIF. During lateral retraction at L4–L5, sustained train-of-four free-run EMG activity erupts in the right L4 and L5 myotomes and persists for 18 seconds before resolving spontaneously. The surgeon is using bipolar cautery near the nerve root.',
    question:
      'Which free-run EMG pattern is MOST concerning for impending nerve root injury?',
    options: [
      'A single brief burst lasting less than one second after retractor placement',
      'Periodic sinusoidal bursting at 10–15 Hz correlating with irrigation flow',
      'Sustained high-frequency neurotonic discharge lasting more than 10 seconds',
      'Intermittent low-amplitude spikes coinciding with cautery activation',
    ],
    correctIndex: 2,
    explanation:
      'Sustained neurotonic discharge (high-frequency, irregular, train-like activity lasting >10 seconds) is the most clinically significant free-run EMG pattern and is associated with mechanical nerve root irritation or impending injury. Brief single bursts on retractor placement are common and usually benign. Sinusoidal bursting correlating with irrigation is a thermal/chemical artifact (cold irrigation). Low-amplitude spikes coinciding with cautery are electrical artifacts from current spread — not neural activity. Alerting the surgeon to sustained neurotonic discharge should prompt immediate reassessment of retraction or instrument position.',
  },
  {
    id: 'case-2026-w20',
    week: '2026-W20',
    title: 'BAEP Wave V Latency Shift',
    specialty: 'Skull Base — Posterior Fossa',
    scenario:
      'A 34-year-old undergoes resection of a right-sided acoustic neuroma via the retrosigmoid approach. After dural opening and cerebellar retraction, the right BAEP waveform shows progressive increase in wave V absolute latency from 5.7 ms at baseline to 6.9 ms. Wave I is unchanged. The surgeon is currently drilling near the internal auditory canal.',
    question:
      'How should this BAEP change be interpreted and communicated?',
    options: [
      'Benign technical artifact — report no change, continue monitoring',
      'Wave I–V interpeak latency increase suggesting retrocochlear (central) dysfunction; alert the team',
      'Loss of wave I indicating cochlear blood supply compromise; recommend urgent hemostasis',
      'Bilateral BAEP suppression consistent with anesthetic effect; request anesthesia assessment',
    ],
    correctIndex: 1,
    explanation:
      'An increase in wave V absolute latency with a stable wave I indicates prolongation of the wave I–V interpeak interval — the retrocochlear conduction time. This reflects dysfunction between the cochlear nerve and the brainstem, not the cochlea itself. The alert criterion for BAEP is typically ≥1.0 ms increase in wave V latency or 50% amplitude reduction. At +1.2 ms here, the threshold is met. The team should be informed so the surgeon can adjust retraction or drilling. Wave I loss would indicate cochlear or cochlear nerve (distal) compromise. Bilateral changes would suggest a systemic/anesthetic cause. This is a unilateral retrocochlear pattern.',
  },
]

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Returns the ISO week key for a given date, e.g. "2026-W17". */
export function getISOWeekKey(date: Date = new Date()): string {
  // ISO 8601 week: week containing the year's first Thursday
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7  // make Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - day)  // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Returns the case for the current ISO week, or the most recent entry
 * if no case exists for this exact week (so the page never goes blank).
 */
export function getCurrentWeeklyCase(): WeeklyCase {
  const key = getISOWeekKey()
  return WEEKLY_CASES.find((c) => c.week === key) ?? WEEKLY_CASES[WEEKLY_CASES.length - 1]
}

/** Returns a specific case by id (for result display after submission). */
export function getWeeklyCaseById(id: string): WeeklyCase | undefined {
  return WEEKLY_CASES.find((c) => c.id === id)
}

// Keep the named export for any existing imports
export const CURRENT_WEEKLY_CASE = getCurrentWeeklyCase()
