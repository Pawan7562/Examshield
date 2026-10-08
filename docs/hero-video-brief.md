# Nexify Examina — Video Production Brief & Asset Specification

**Audience**: University Registrars, Compliance Officers, Examination Controllers, and Testing Board Deans  
**Product**: Nexify Examina — Autonomous AI & Live Proctoring Platform  
**Delivery Path**: `/frontend/public/videos/` and `/frontend/public/images/`

---

## 1. Asset Deliverables Summary

| Asset Filename | Format / Codec | Target Resolution | Duration | Max File Size | Target Bitrate | Audio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hero-loop.webm` | WebM (VP9) | 1920 × 1200 (16:10) | 18–22s | < 3.0 MB | 1,100–1,400 kbps | Silent (No track) |
| `hero-loop.mp4` | MP4 (H.264 / AAC) | 1920 × 1200 (16:10) | 18–22s | < 3.0 MB | 1,200–1,500 kbps | Silent (No track) |
| `hero-poster.jpg` | JPEG (sRGB, 85% Q) | 1920 × 1200 (16:10) | Still Frame | < 180 KB | N/A | N/A |
| `demo.mp4` | MP4 (H.264 / AAC) | 1920 × 1200 (16:10) | ~90s (±5s) | < 25 MB | 2,200–2,800 kbps | Stereo, -16 LUFS |
| `demo-poster.jpg` | JPEG (sRGB, 85% Q) | 1920 × 1200 (16:10) | Still Frame | < 220 KB | N/A | N/A |
| `demo.vtt` | WebVTT (UTF-8) | Text | ~90s | < 10 KB | N/A | Timecoded Text |

---

## 2. Hero Loop Storyboard (18–22 Seconds, Silent, Seamless Loop)

**Concept**: A calm, high-trust walkthrough of a live examination session inside the Nexify Examina proctor cockpit. Demonstrates automated detection, human review, and court-admissible audit generation.

* **00:00 – 00:05 | State 1: Baseline Verification**
  * *Visual*: Proctor dashboard opens on candidate Sarah Mitchell (CS-2025-041, Distributed Systems Examination).
  * *UI Details*: Clean white/light-gray chrome with subtle border. Top bar reads `Live Session Review · Session #ES-8941 · Active (42m 10s)`.
  * *Status Chips*: 
    * `Identity Verified` (Green chip, biometric baseline matched)
    * `Browser Locked` (Green chip, full-screen kiosk active)
    * `Audio Baseline: 14 dB` (Normal ambient room sound)
  * *Motion*: Gentle, realistic typing/writing motion by candidate. No neon mesh or dotted matrix.

* **00:05 – 00:10 | State 2: Anomaly Flagged at 00:42:18**
  * *Visual*: Subtle ambient audio spike occurs (a second voice whisper). 
  * *UI Response*: Waveform meter briefly shifts from gray baseline to amber chip: `Secondary Voice Detected (+18 dB above baseline)`.
  * *Camera*: Camera remains smooth, highlighting the flagged event in the timeline log at timestamp `00:42:18`.
  * *No Sci-Fi Effects*: No red flashing screens, sirens, or lasers. Clean enterprise flag indicator identical to modern compliance software (e.g., Datadog, Stripe Radar).

* **00:10 – 00:16 | State 3: Proctor Inspects Evidence Clip**
  * *Visual*: Proctor cursor clicks `Review Incident Clip (00:42:14 – 00:42:24)`.
  * *UI Response*: A modal drawer slides in showing synchronized dual telemetry: 10-second candidate webcam clip alongside synchronized audio spectrogram.
  * *Action*: Proctor selects outcome: `Flagged for Academic Review Committee`.

* **00:16 – 00:22 | State 4: Tamper-Evident Audit Report Generated & Signed**
  * *Visual*: Proctor clicks `Export Session Dossier`. 
  * *UI Response*: Cryptographic SHA-256 seal animation completes (`Hash: 9f8a...c3d1 · FERPA & GDPR Certified`). PDF report badge appears with digital university signature.
  * *Loop Transition*: View zooms out gracefully back to the initial dashboard state for seamless looping.

---

## 3. 90-Second Product Demo Storyboard & Voiceover Script

### Scene Breakdown & Captions

#### Scene 1: Introduction & Academic Problem (00:00 – 00:14)
* **Visual**: Wide shot of a university campus transitioning to the Nexify Examina executive console. Registrars and exam controllers managing multi-department finals.
* **Voiceover**: 
  > *"For universities and certification bodies, high-stakes online examinations require unwavering trust. Nexify Examina delivers autonomous AI and live proctoring engineered for registrars, exam controllers, and compliance teams."*
* **On-Screen Text**: `Nexify Examina · Institutional-Grade Assessment Security`

#### Scene 2: Zero-Install Candidate Onboarding (00:14 – 00:30)
* **Visual**: Candidate checks in. Zero software downloads, zero kernel-level drivers. Chrome/Edge/Firefox browser kiosk check.
* **Voiceover**: 
  > *"Candidates begin instantly with zero software installation. Continuous biometric verification authenticates identity before and throughout the exam, while full-screen kiosk sandboxing prevents tab switching, copy-pasting, and secondary displays without invasive kernel extensions."*
* **On-Screen Text**: `100% In-Browser Kiosk · Continuous Biometric Verification`

#### Scene 3: Intelligent Anomaly Detection (00:30 – 00:50)
* **Visual**: Proctor cockpit showing 24 candidate streams. Intelligent triage prioritizes candidates needing review. Dual audio analysis flags whispering vs background AC hum.
* **Voiceover**: 
  > *"During the assessment, autonomous analytics evaluate face presence, gaze drift, and acoustic anomalies. Unlike rigid legacy tools, Nexify Examina filters ambient noise to isolate genuine dictation or unauthorized second voices, instantly bookmarking incidents with millisecond precision."*
* **On-Screen Text**: `Acoustic Whisper Filter · Prioritized Incident Triage`

#### Scene 4: Human-in-the-Loop Proctor Intervention (00:50 – 01:10)
* **Visual**: Proctor opens a flagged incident at 00:42:18. Plays a 10-second synced snippet, issues a calibrated warning message directly to candidate screen without interrupting other test-takers.
* **Voiceover**: 
  > *"Proctors maintain full control. Instant playback allows controllers to verify anomalies in context, dispatch non-disruptive warnings, or escalate cases to faculty committees with full evidence attached."*
* **On-Screen Text**: `Live Incident Playback · Calibrated Candidate Messaging`

#### Scene 5: Cryptographic Tamper-Evident Audit Dossiers (01:10 – 01:30)
* **Visual**: Final exam submission. Automated generation of signed PDF compliance dossier containing timeline, biometric logs, and immutable SHA-256 integrity hash.
* **Voiceover**: 
  > *"When the exam concludes, the platform generates a comprehensive audit dossier, cryptographically sealed and fully compliant with FERPA, GDPR, and ISO 27001 standards. Secure every assessment and protect institutional integrity with Nexify Examina."*
* **On-Screen Text**: `FERPA · GDPR · ISO 27001 Aligned · Court-Admissible Dossiers`

---

## 4. Technical Encoding & Production Specifications

1. **Aspect Ratio & Resolution**:
   - Master resolution: `1920 × 1200` (16:10 aspect ratio).
   - Critical action safe area: Keep all essential UI text and indicators inside `1800 × 1120`.

2. **Hero Loop (`hero-loop.webm` & `hero-loop.mp4`)**:
   - WebM Codec: VP9 (`libvpx-vp9`), two-pass encoding, CRF 32, maxrate 1400k, bufsize 2800k.
   - MP4 Codec: H.264 (Baseline or Main profile, level 4.1), `yuv420p`, CRF 23, maxrate 1500k.
   - File size ceiling: **Strictly under 3.0 MB** to avoid bandwidth strain on mobile and metered connections.
   - Audio: Remove audio track entirely (`-an`).

3. **90-Second Demo Video (`demo.mp4`)**:
   - Video Codec: H.264 High Profile, CRF 22, 1080p or 1200p, 2500 kbps target bitrate.
   - Audio Codec: AAC-LC, 160 kbps, 48 kHz, Stereo. Master loudness: `-16 LUFS` (broadcast standard).
   - File size ceiling: Under 25 MB.

4. **Poster Frames (`hero-poster.jpg` & `demo-poster.jpg`)**:
   - 1920 × 1200 sRGB JPEG, 85% quality, optimized/progressive, under 200 KB.
   - Hero poster must capture the initial clean dashboard state before any anomaly flags.

---

## 5. Style Guidelines (What to Do vs. What to Avoid)

| Recommended Enterprise Style (Do) | Unprofessional Sci-Fi Style (Avoid) |
| :--- | :--- |
| Real product UI with crisp 1px borders and neutral gray palettes (`#f8fafc`, `#0f172a`) | AI-generated fantasy HUDs, green matrix code, dark cyberspace backgrounds |
| Subtle status pills with quiet status colors (emerald `#059669`, amber `#d97706`) | Blinking neon lasers, scanlines, floating holographic orbs |
| Realistic mixed candidate statuses (e.g., 23 verified, 1 pending review) | Fake "99.8% integrity", "468 landmark nodes", "Sub-180ms neural mesh" claims |
| High-legibility typography matching Inter and Space Grotesk | Monospace hacker fonts, robotic voices, synthetic AI speech glitches |
| Human proctor workflow: review -> verify -> sign | "Robotic autonomous AI ban hammer" or punitive terminology |
