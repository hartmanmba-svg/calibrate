export type WeeklyCase = {
  id: string
  title: string
  week: string  // ISO week string like "2026-W17"
  specialty: string
  scenario: string  // 2-3 sentence clinical scenario
  question: string
  options: string[]  // 4 options
  correctIndex: number  // 0-based
  explanation: string
}

export const CURRENT_WEEKLY_CASE: WeeklyCase = {
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
}
