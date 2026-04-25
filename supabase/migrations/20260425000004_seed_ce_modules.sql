-- ============================================================
-- Seed CE modules with real IONM continuing education content
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

INSERT INTO ce_modules (title, description, credits) VALUES
  (
    'SSEP Fundamentals and Clinical Application',
    'Somatosensory evoked potential acquisition, waveform interpretation, and alert criteria for spinal and neurovascular surgeries.',
    1.0
  ),
  (
    'Motor Evoked Potentials in Spinal Surgery',
    'Transcranial electrical MEP methodology, anesthetic considerations, and response to intraoperative events.',
    1.0
  ),
  (
    'EMG Monitoring: Free-Run and Triggered Techniques',
    'Continuous EMG for nerve root integrity monitoring and stimulated EMG for pedicle screw and nerve proximity testing.',
    1.0
  ),
  (
    'Brainstem Auditory Evoked Potentials',
    'BAEP acquisition and interpretation for posterior fossa and skull base procedures, including retractor-related changes.',
    1.0
  ),
  (
    'EEG and Cerebrovascular Monitoring',
    'Intraoperative EEG for carotid endarterectomy and cerebral aneurysm surgery, burst suppression, and ischemia recognition.',
    1.0
  ),
  (
    'Anesthetic Effects on Evoked Potentials',
    'How volatile agents, propofol, ketamine, and opioids affect SSEP, MEP, and BAEP amplitudes and latencies.',
    1.0
  ),
  (
    'Alert Criteria and Clinical Communication',
    'Evidence-based thresholds for significant changes, surgeon notification protocols, and documentation standards.',
    1.0
  ),
  (
    'Pediatric Neuromonitoring Considerations',
    'Technical challenges, developmental norms, and case-specific strategies for scoliosis, tethered cord, and posterior fossa surgery in children.',
    1.0
  ),
  (
    'Multimodality Monitoring Integration',
    'Combining SSEP, MEP, EMG, and EEG for comprehensive spinal cord and nerve root protection across complex surgical scenarios.',
    1.5
  ),
  (
    'Documentation, Billing, and Compliance',
    'Medical necessity documentation, CPT coding for IONM services, supervision requirements, and compliance with payer policies.',
    1.0
  )
ON CONFLICT DO NOTHING;
