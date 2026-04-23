-- ============================================================
-- Calibrate — Starter Card Seed  (idempotent — safe to re-run)
-- ============================================================
-- 45 cards across three thematic groups:
--   Group 1 (cards 01-15): Surgical Monitoring Basics
--   Group 2 (cards 16-30): Anesthesia & IONM Interactions
--   Group 3 (cards 31-45): Neurosurgery / IONM Essentials
--
-- Run in Supabase SQL editor or via: supabase db seed
-- ============================================================

INSERT INTO cards (id, front, back, explanation, modality, case_type, card_type, created_at, updated_at) VALUES

-- ================================================================
-- GROUP 1: Surgical Monitoring Basics (didactic)
-- ================================================================

(
  'c0000000-0000-0000-0000-000000000001',
  'What is the standard SSEP alert criterion for amplitude?',
  '≥50% decrease from baseline',
  'The 50% amplitude reduction criterion is the most widely used SSEP alert threshold. Some centres use a more conservative 40% threshold. Changes must be reproducible across multiple averages before alerting the surgeon. A single noisy average should never trigger an alert.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000002',
  'What is the standard SSEP alert criterion for latency?',
  '≥10% increase from baseline latency',
  'Latency prolongation of 10% or greater suggests conduction slowing, typically from ischemia, mechanical compression, or temperature changes. Isolated latency changes without amplitude loss are less specific for injury but should still be communicated to the surgical and anesthesia teams.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000003',
  'What does the P37 component represent in lower-extremity SSEPs?',
  'The primary cortical response to posterior tibial nerve stimulation, generated in the primary somatosensory cortex',
  'P37 (also called P40) is recorded at the scalp over the midline (CPz or Cz) with reference to a non-cephalic or frontal electrode. It represents cortical activation via the posterior columns and thalamus approximately 37–40 ms after tibial nerve stimulation at the ankle.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000004',
  'What does the N20 component represent in upper-extremity SSEPs?',
  'The primary cortical response to median nerve stimulation, generated near the central sulcus',
  'N20 is recorded at the contralateral scalp (C3'' or C4'') with reference to Fpz or Fz. It represents thalamocortical activation approximately 20 ms after median nerve stimulation at the wrist. It is the primary component monitored during cervical spine and cranial procedures.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000005',
  'Which spinal cord pathway do SSEPs primarily monitor?',
  'The dorsal column–medial lemniscal pathway (posterior columns)',
  'SSEPs assess the posterior columns, which carry proprioception and vibration. The anterior cord (corticospinal tract) is NOT reliably assessed by SSEPs — this is the core rationale for adding MEP monitoring in high-risk cases. A patient can have a significant motor deficit while SSEPs remain unchanged.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000006',
  'What is the primary function of free-run EMG during spine surgery?',
  'Continuous monitoring for nerve root irritation or injury via spontaneous electrical activity',
  'Free-run EMG detects spontaneous activity (bursts, trains) caused by nerve root manipulation, retraction, or thermal injury. It provides real-time feedback without requiring patient stimulation. Sustained neurotonic discharge trains are more clinically significant than brief bursts and should prompt communication with the surgeon.',
  'emg_free', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000007',
  'What is a neurotonic discharge in free-run EMG, and why is it significant?',
  'A sustained, repetitive train of motor unit potentials in a myotome lasting >1 second, indicating nerve root irritation',
  'Neurotonic discharges have a characteristic repetitive quality — often described as "machine gun" or "marching." They differ from brief artifact bursts by their duration and regularity. The surgeon should be notified to modify technique (release retraction, irrigate with warm saline). Brief phasic bursts alone are less concerning.',
  'emg_free', 'peripheral_nerve', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000008',
  'What stimulation rate is standard for SSEPs, and why?',
  '2–5 Hz — avoids stimulus artifact overlap and high-frequency habituation',
  'Rates above 5 Hz can cause overlap of successive responses and habituation of the cortical component. Most protocols use rates like 3.1 or 4.7 Hz (non-integer values to avoid locking onto 60 Hz power-line noise harmonics). Higher rates reduce averaging time but may degrade signal quality, especially for cortical responses.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000009',
  'Which nerve is stimulated for upper-extremity SSEPs, and where?',
  'The median nerve at the wrist (cathode over flexor carpi radialis tendon, anode 2–3 cm proximal)',
  'The median nerve (C6–T1) is the standard choice. Stimulation intensity is titrated to produce a visible thumb twitch without exceeding 25–30 mA. The ulnar nerve at the wrist (C8–T1) can be added to improve C8 coverage. Stimulus duration is typically 0.2–0.3 ms.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000010',
  'Which nerve is stimulated for lower-extremity SSEPs, and where?',
  'The posterior tibial nerve at the medial ankle (cathode posterior to medial malleolus)',
  'The posterior tibial nerve (L4–S2) provides monitoring of the lumbosacral roots and the posterior columns of the lumbar and lower thoracic cord. The common peroneal nerve (L4–S1) at the fibular head can be added for more complete lower-extremity coverage, particularly for L4–L5 root monitoring.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000011',
  'What is the lumbar spinal potential (N22) and why is it useful?',
  'A far-field potential recorded over the lumbar spine (L1–T12) that confirms cauda equina signal transmission',
  'The N22 (lumbar potential) is a checkpoint between the peripheral stimulus and the cortical response. If the lumbar potential is absent but the Erb''s point potential is present, the problem is at the cauda equina or lumbar cord. If both are absent, suspect a peripheral nerve or stimulation problem. Loss of lumbar potential with preserved cortical signals is unusual and suggests an artefactual issue.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000012',
  'What physiologic change most commonly causes SSEP amplitude decrease without neurological injury?',
  'Hypothermia — for every 1°C decrease in core temperature, latency increases ~1 ms and amplitude decreases',
  'Below 28–30°C, cortical SSEPs may become unmonitorable entirely. Always trend temperature alongside SSEP waveforms on the same display. SSEP changes in a cooling patient should be attributed to temperature until proven otherwise. Subcortical potentials (spinal, brainstem) are more resistant to hypothermia than cortical responses.',
  'ssep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000013',
  'What does the Erb''s point potential (N9) confirm in upper-extremity SSEPs?',
  'Peripheral signal transmission through the brachial plexus — confirms the stimulus reached the nerve plexus',
  'Erb''s point is recorded at the supraclavicular fossa ipsilateral to stimulation. N9 is a checkpoint: if absent or degraded, the problem is peripheral (electrode, stimulator, nerve conduction, or plexus) rather than spinal or cortical. Interpreting cortical changes without monitoring Erb''s point is like diagnosing an engine problem without checking the fuel gauge.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000014',
  'What does the N13 cervical potential represent?',
  'Postsynaptic activity in the dorsal horn at C5, confirming signal transmission through the upper cervical cord',
  'N13 (also N14) is recorded at the C5 spinous process or nape of neck. It is invaluable for localising changes during cervical surgery: if N13 is lost but Erb''s point is preserved, the lesion is at or below C5. If cortical responses change but N13 is intact, the change is above the cervical cord (thalamic, cortical, or anesthetic). It bridges the gap between peripheral and cortical monitoring.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000015',
  'Why is signal averaging necessary for recording cortical SSEPs?',
  'Cortical SSEPs (0.1–10 µV) are far smaller than background EEG (10–100 µV) and must be extracted by summing time-locked responses to cancel random noise',
  'Each stimulus triggers a response at a fixed latency (time-locked), while EEG noise is random. Averaging N sweeps improves signal-to-noise ratio by √N. Typical cortical averages require 200–500 sweeps, achievable in 60–150 seconds at standard stimulation rates. Faster averages are noisier; the technologist must balance speed of feedback against signal quality.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),

-- ================================================================
-- GROUP 2: Anesthesia & IONM Interactions (didactic)
-- ================================================================

(
  'c0000000-0000-0000-0000-000000000016',
  'How do volatile anesthetic agents affect SSEP waveforms?',
  'Dose-dependent cortical amplitude reduction and latency prolongation; subcortical potentials are largely spared',
  'At 1 MAC, cortical SSEP amplitude typically decreases ~50% and latency increases 1–2 ms. Subcortical potentials (N13, Erb''s point, lumbar) are much less affected, which can help localise whether a change is anesthetic or structural. Maintaining a stable anesthetic depth is more important than the specific agent used.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000017',
  'What anesthetic technique is preferred when MEP monitoring is required?',
  'Total intravenous anesthesia (TIVA) — typically propofol infusion + opioid (remifentanil or fentanyl)',
  'Volatile anesthetics dramatically suppress MEPs at surgical concentrations. Propofol, a GABA-A agonist, allows reliable MEP monitoring at infusion rates of 100–150 mcg/kg/min. Remifentanil is preferred as the opioid component for its predictable, short context-sensitive half-life. When switching from volatile to TIVA, allow adequate washout time before establishing MEP baselines.',
  'mep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000018',
  'Why is nitrous oxide (N₂O) avoided during MEP monitoring?',
  'N₂O causes significant amplitude suppression of MEPs — even low concentrations (30–50%) can render them unmonitorable',
  'Nitrous oxide has a ceiling effect distinct from volatile agents: even sub-analgesic concentrations can substantially depress MEP amplitude. It is generally incompatible with reliable MEP monitoring. When MEPs are planned, nitrous oxide should be discontinued and washed out before baseline establishment. The IONM team should confirm N₂O is off before starting.',
  'mep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000019',
  'How do neuromuscular blocking agents (NMBAs) affect MEP monitoring?',
  'Full paralysis abolishes muscle MEPs entirely; even partial blockade reduces amplitude and may cause false-alert responses',
  'Transcranial MEPs recorded from muscle (tcMEPs) require intact neuromuscular transmission. A train-of-four (TOF) count of 3–4 twitches is generally required for reliable MEP recording. If NMBAs were used for intubation, MEP baselines should be established only after the block wears off. Neurogenic MEPs recorded from peripheral nerves are unaffected by NMBAs but are less sensitive.',
  'mep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000020',
  'What is the effect of a propofol bolus on intraoperative SSEPs and MEPs?',
  'Transient amplitude suppression lasting 1–5 minutes, dose-dependent',
  'Propofol boluses are one of the most common causes of transient intraoperative waveform changes. The IONM team should be notified before or immediately after bolus administration so changes can be contextualised. Recovery to baseline within a few minutes in temporal correlation with the bolus is reassuring and does not require a surgical alert.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000021',
  'How does intraoperative hypotension affect SSEP amplitude?',
  'MAP below the spinal cord autoregulation threshold causes ischemia, decreasing SSEP amplitude and increasing latency',
  'Spinal cord perfusion pressure depends on MAP minus epidural venous pressure. A MAP below ~50–65 mmHg (patient-specific) can cause cord ischemia. The critical threshold is higher in patients with pre-existing hypertension or cord compression. SSEP changes correlating with blood pressure drops should prompt immediate vasopressor use and position review.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000022',
  'At approximately what core temperature do cortical SSEPs become unmonitorable?',
  'Below ~28–30°C',
  'Cortical SSEPs disappear with severe hypothermia due to synaptic failure in the thalamocortical pathway. Surgeons planning deep hypothermic circulatory arrest (DHCA) use cortical SSEP silence — alongside EEG isoelectricity — as a marker of cerebral protection. Subcortical and spinal potentials persist at lower temperatures, allowing some continued monitoring.',
  'ssep', 'spinal_tumor', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000023',
  'What is the effect of ketamine on MEP monitoring?',
  'Ketamine tends to enhance or preserve MEP amplitude and does not suppress SSEPs',
  'Ketamine (NMDA antagonist) is unusual among anesthetics in that it can augment cortical excitability and improve MEP amplitude. Sub-anesthetic infusions (0.5–1 mg/kg/hr) are sometimes added to TIVA regimens when MEPs are difficult to obtain — for example, in patients with high baseline deficits or morbid obesity. Hallucinations at emergence are mitigated by concurrent propofol.',
  'mep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000024',
  'What is the IONM profile of dexmedetomidine (Precedex)?',
  'Minimal effect on SSEPs; slight MEP amplitude reduction possible; generally safe as an adjunct in TIVA',
  'Dexmedetomidine (alpha-2 adrenergic agonist) provides sedation, analgesia, and sympatholysis with a relatively favorable neuromonitoring profile compared to volatile agents. It is commonly used as an opioid-sparing adjunct in TIVA. Its main practical concern is that it can cause bradycardia and hypotension, which affect SSEPs secondarily.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000025',
  'How does hyperventilation (low PaCO₂) affect intraoperative neuromonitoring?',
  'Cerebral vasoconstriction reduces cerebral blood flow, which can decrease cortical SSEP and EEG amplitude',
  'PaCO₂ below 30 mmHg causes cerebral vasoconstriction and reduced cerebral perfusion. This is more relevant for cortical SSEPs and EEG than for spinal monitoring. Normocapnia (PaCO₂ 35–45 mmHg) is preferred during IONM. When unexplained cortical changes occur, always ask anesthesia for the current end-tidal CO₂ reading.',
  'ssep', 'supratentorial', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000026',
  'Why are volatile agents more suppressive of MEPs than SSEPs at the same concentration?',
  'MEP generation requires high-frequency cortical firing and involves more synapses; volatile agents disproportionately suppress high-frequency repetitive neuronal activity',
  'At 0.5 MAC sevoflurane, SSEPs may be only mildly affected while MEPs can be reduced 50–80%. MEP generation requires synchronised firing of multiple cortical motor neurons to summate a D-wave and I-waves that descend the corticospinal tract. This repetitive synaptic activity is highly sensitive to volatile agent-mediated GABA enhancement.',
  'mep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000027',
  'How does severe intraoperative anaemia (low haematocrit) affect SSEP monitoring?',
  'Reduces oxygen-carrying capacity, potentially causing ischemic SSEP amplitude decrease at the spinal cord or brain',
  'Haematocrit below 15–18% impairs oxygen delivery to neural tissue. SSEP changes during significant haemorrhage should be interpreted alongside haemoglobin level and MAP. Transfusion to a haematocrit of ≥20–25% may restore amplitude. The combination of hypotension + anaemia is particularly dangerous for spinal cord perfusion.',
  'ssep', 'spinal_tumor', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000028',
  'What does MAC stand for and why is it relevant to IONM?',
  'Minimum Alveolar Concentration — the concentration at which 50% of patients do not move in response to surgical incision; SSEP and MEP suppression are dose-dependent on MAC',
  'MAC is the standard unit of volatile anesthetic potency. IONM teams must understand MAC because cortical evoked potential changes correlate with end-tidal MAC values. Most protocols aim to keep end-tidal concentration ≤0.5 MAC when SSEP monitoring is required, and avoid volatile agents entirely (use TIVA) when MEP monitoring is planned.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000029',
  'Why is etomidate sometimes used to augment SSEP baselines?',
  'Etomidate enhances cortical SSEP amplitude (unlike most anesthetics), making it useful for establishing baselines in high-risk patients',
  'A small etomidate bolus (0.1–0.2 mg/kg IV) dramatically augments cortical SSEP amplitude and is sometimes used when baseline signals are poor — in patients with myelopathy, obesity, or pre-existing deficits. The enhancement is transient (~10 min). Etomidate is not used for maintenance because repeated doses cause adrenal suppression. Document etomidate use to avoid confusing the augmented baseline with a true change.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000030',
  'What is the recommended team communication protocol when SSEP or MEP changes occur intraoperatively?',
  'Immediately notify surgeon and anesthesiologist simultaneously; identify and document the timing of surgical and anesthetic events; determine if changes resolve with intervention',
  'Effective IONM depends on a team-based communication framework. When changes occur: (1) verify the change is real (check electrodes, stimulator, impedances); (2) alert surgeon and anesthesia simultaneously; (3) document all concurrent events — surgical manoeuvres, blood pressure, temperature, drug boluses; (4) track whether the change resolves after intervention. Failure to communicate promptly or verify artifact is the most common cause of preventable IONM-related adverse events.',
  'ssep', 'lumbar', 'didactic', NOW(), NOW()
),

-- ================================================================
-- GROUP 3: Neurosurgery / IONM Essentials (didactic + clinical)
-- ================================================================

(
  'c0000000-0000-0000-0000-000000000031',
  'During posterior fossa surgery, what does a change in BAEP wave V indicate?',
  'Possible compression, ischemia, or traction injury of the auditory nerve or its brainstem projections',
  'BAEP wave V arises from the lateral lemniscus near the inferior colliculus and is the most clinically important BAEP component. Surgical retraction, vessel manipulation near the internal auditory artery, or direct traction on cranial nerve VIII can all cause wave V changes. Changes are often reversible if identified early and the surgeon modifies the approach.',
  'baep', 'posterior_fossa', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000032',
  'What are the standard BAEP alert criteria for hearing-preservation surgery?',
  '≥50% decrease in wave V amplitude, OR ≥0.5 ms increase in wave V absolute latency, OR complete loss of wave V',
  'These criteria apply to cerebellopontine angle tumour resection (acoustic neuroma/vestibular schwannoma), microvascular decompression (MVD), and other posterior fossa procedures. Loss of wave V that persists for >5–10 minutes despite surgical modification predicts significant postoperative sensorineural hearing loss. The III–V interpeak interval widens with distortion of the pons or auditory nerve.',
  'baep', 'skull_base', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000033',
  'A patient is undergoing L4–L5 TLIF. The surgeon places the right L4 pedicle screw and triggered EMG at 4.5 mA evokes a response in the right tibialis anterior. What does this indicate?',
  'The pedicle screw has likely breached the medial or inferior cortex of the L4 pedicle and is in proximity to the right L4 nerve root',
  'A threshold below 6–8 mA indicates cortical breach and nerve root proximity. The surgeon should be alerted immediately. Options include screw removal and revision under fluoroscopy, cone-beam CT, or O-arm imaging. Left untreated, a malpositioned screw can cause root injury, radiculopathy, or chronic pain. A threshold above 10–12 mA generally indicates safe cortical containment.',
  'emg_triggered', 'lumbar', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000034',
  'What stimulation parameters are used for triggered EMG pedicle screw testing?',
  'Monopolar constant-current stimulation, 0.2 ms pulse width, 1–2 Hz, current ramped from 0 to 20 mA',
  'Current is increased incrementally and the threshold that evokes a visible or recorded muscle response in the corresponding myotome is noted. The reference electrode is placed in subcutaneous tissue away from the surgical field. Bipolar stimulation gives higher thresholds and is less reliable for breach detection. A pedicle awl or probe can also be stimulated before screw placement to check wall integrity.',
  'emg_triggered', 'lumbar', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000035',
  'During left frontal craniotomy for tumour resection, the right upper-extremity SSEP amplitude decreases 60% with no anesthetic changes. The right lower-extremity SSEP is unchanged. What is the most likely interpretation?',
  'Compromise of the left somatosensory cortex or subcortical tracts serving the contralateral arm — the motor strip is immediately anterior and may also be at risk',
  'Upper-extremity SSEPs are represented on the lateral convexity of the primary somatosensory cortex (hand area). A focal decrease during resection near the central sulcus indicates that the hand area is being compromised. The surgeon should be alerted; if MEPs are also monitored and show changes, the risk is compounded. Preserved lower-extremity SSEPs confirm the change is focal rather than systemic.',
  'ssep', 'supratentorial', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000036',
  'During thoracic spine surgery, lower-extremity SSEPs are lost bilaterally but lower-extremity MEPs are preserved. What cord syndrome does this pattern suggest?',
  'Posterior cord syndrome — isolated dorsal column injury with intact corticospinal tracts',
  'The dissociation between SSEP loss and MEP preservation is the hallmark of posterior cord syndrome. Motor function is intact (MEPs normal) but proprioception and vibration will be affected postoperatively. While less devastating than anterior cord syndrome, it still warrants surgical alert. The surgeon should review positioning, retraction, and instrumentation for posterior cord compromise.',
  'ssep', 'cervical', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000037',
  'What is four-extremity SSEP + MEP monitoring and when is it used?',
  'Simultaneous bilateral upper and lower extremity SSEP and MEP monitoring — standard for cervical spine surgery where both the cord and nerve roots are at risk',
  'During cervical procedures, the cord is at risk both at the operative level (nerve root, cord compression) and below (hypoperfusion, global ischemia). Bilateral upper extremity changes with preserved lower extremity signals suggest a focal cervical finding. Lower extremity changes with or without upper extremity involvement indicate cord compromise below the hands. MEPs add anterior column coverage that SSEPs cannot provide.',
  'ssep', 'cervical', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000038',
  'What is D-wave monitoring and why is it preferred over muscle MEPs alone in intramedullary spinal cord tumour surgery?',
  'The D-wave is an epidurally recorded compound action potential of the corticospinal tract; it is unaffected by anesthesia and neuromuscular blockade, making it a more direct and reliable indicator of motor tract integrity',
  'The D-wave is recorded via an epidural electrode rostral or caudal to the tumour after transcranial electrical stimulation. Unlike muscle MEPs, it does not require an intact neuromuscular junction. A >50% D-wave amplitude reduction is associated with permanent motor deficit. Loss of muscle MEPs with a preserved D-wave generally predicts transient, recoverable deficits. D-wave monitoring is the gold standard for intramedullary surgery.',
  'dwave', 'spinal_tumor', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000039',
  'During carotid endarterectomy, the ipsilateral EEG shows 50% amplitude attenuation 45 seconds after carotid cross-clamping. What is the clinical implication and next step?',
  'Cerebral ischemia from inadequate collateral flow — alert the surgeon immediately to consider shunt placement',
  'EEG is the primary monitoring modality during CEA. Focal ipsilateral slowing or amplitude reduction within 60 seconds of cross-clamping indicates that the circle of Willis is not providing adequate collateral flow to the ipsilateral hemisphere. Shunting restores flow; with shunt in place, EEG typically normalises within 1–2 minutes. Failure to alert promptly can result in ischemic stroke.',
  'eeg', 'carotid', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000040',
  'What is the Stagnara wake-up test and when might it still be used?',
  'Temporary lightening of anesthesia to allow the patient to follow commands (squeeze hands, move feet), confirming motor function intraoperatively',
  'The wake-up test was the primary motor assessment before MEP monitoring. It requires a reversible anesthetic technique, patient cooperation during the preoperative consent, and a coordinated team. Risks include awareness, accidental extubation, air embolism, and patient movement causing implant displacement. It may still be used when MEPs are unobtainable or as a confirmatory test after a major intraoperative event.',
  'mep', 'scoliosis', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000041',
  'Bilateral lower-extremity SSEPs decrease 40% simultaneously during lumbar fusion. MEPs are unchanged. What is the most likely cause?',
  'A systemic physiological change — most likely hypotension, anesthetic bolus, hypothermia, or technical artifact — rather than a structural cord injury',
  'Simultaneous symmetric bilateral changes strongly suggest a systemic rather than structural aetiology. The sequence to follow: (1) check MAP — ask anesthesia for current blood pressure; (2) ask about recent drug boluses; (3) check temperature trend; (4) verify electrode integrity. Unilateral or asymmetric changes that do not correspond to an anesthetic event are far more concerning for a structural injury.',
  'ssep', 'lumbar', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000042',
  'What modalities are monitored during tethered spinal cord release surgery?',
  'Free-run EMG from lower extremity and sphincter myotomes, lower-extremity SSEPs, and bulbocavernosus reflex (BCR) — with MEPs as an optional addition',
  'Tethered cord surgery risks the conus medullaris and sacral nerve roots (S2–S4). Free-run EMG provides real-time feedback during filum or adhesion dissection. BCR monitors the sacral reflex arc essential for bladder, bowel, and sexual function. Lower-extremity SSEPs assess the posterior columns. The combination of EMG + BCR + SSEP provides complementary coverage of the structures most at risk.',
  'emg_free', 'tethered_cord', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000043',
  'What is the bulbocavernosus reflex (BCR) and why is it monitored in sacral and tethered cord surgery?',
  'A reflex arc (S2–S4) recorded by stimulating the pudendal nerve and recording from the external anal sphincter or bulbocavernosus muscle — it monitors sacral root and conus function',
  'The BCR assesses the same sacral roots responsible for voluntary bladder, bowel, and sexual function. Injuries at the S2–S4 level cause neurogenic bladder and bowel and sexual dysfunction — often more disabling to patients than limb weakness. BCR is more sensitive for sacral root compromise than lower-extremity SSEPs or MEPs. Loss of BCR with preserved limb signals isolates the injury to the sacral cord.',
  'emg_free', 'tethered_cord', 'didactic', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000044',
  'A 13-year-old with adolescent idiopathic scoliosis (AIS) undergoes posterior spinal fusion T4–L1. During rod rotation, lower-extremity MEPs decrease 60% bilaterally. SSEPs are unchanged. What is the appropriate response?',
  'Alert the surgeon immediately — MEP changes with preserved SSEPs suggest anterior cord compromise; ask surgeon to hold, release the construct, and optimise MAP',
  'During scoliosis correction, the corrective manoeuvre (rod rotation, compression, distraction) places the cord at risk for stretch or vascular compromise. Bilateral MEP loss with preserved SSEPs is a classic pattern for anterior cord ischaemia. Immediate steps: (1) alert surgeon; (2) reverse or hold the corrective manoeuvre; (3) increase MAP to ≥80 mmHg; (4) administer steroids per protocol; (5) monitor for recovery. If MEPs recover, correction can proceed cautiously.',
  'ssep', 'pediatric', 'clinical', NOW(), NOW()
),
(
  'c0000000-0000-0000-0000-000000000045',
  'What is the prognostic significance of MEP recovery after a surgical intervention versus persistent MEP loss?',
  'MEP recovery after the surgeon modifies technique predicts good motor outcomes; persistent loss despite all interventions is associated with high risk of permanent postoperative motor deficit',
  'The reversibility of MEP changes is the most clinically important variable. If MEPs recover within 15–20 minutes after the surgeon releases retraction, revises a screw, or improves cord perfusion, the neurological prognosis is generally favourable. Persistent MEP loss despite optimised MAP, released instrumentation, and steroid administration predicts significant risk of permanent motor deficit and should prompt serious consideration of waking the patient or ending the procedure.',
  'mep', 'spinal_tumor', 'clinical', NOW(), NOW()
)

ON CONFLICT (id) DO NOTHING;
