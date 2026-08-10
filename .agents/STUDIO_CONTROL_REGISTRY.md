# 🏛️ Unified Studio Control Registry (USCR) Rulebook & Control Matrix

---

## 📌 Executive Architectural Contract

The **Unified Studio Control Registry (USCR)** serves as the single source of truth for all UI button controls, floating mentorship hotspots, and sensory overlay elements across Acts I through V in Memory Weaver.

### Core Principle: Zero Decoupled State Drift
No component may define ad-hoc, uncoordinated visibility conditions or isolated rendering logic. All controls MUST derive their state, labels, and rendering rules directly from the USCR contract defined in [`src/config/studioControlMatrix.ts`](file:///c:/Users/home/studio/src/config/studioControlMatrix.ts).

---

## 🎯 Control Registry Matrix (Acts I – V)

| Control ID | Location | Visible Stages | Allowed When Locked? | Affected Layers | Active State Label | Inactive State Label |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HS_HEADER_CLEAN_READ_BTN` | Header | Acts I – V (0–4) | **Yes** | `sentence_anchors`, `mentorship_badges`, `director_ink_underlines`, `tonal_pivot_sparkles` | **Clean Read** | **Sensory View On** |
| `HS_ACT1_CLEAN_VIEW_BTN` | Dock | Act I (0) | **Yes** | `sentence_anchors`, `mentorship_badges`, `director_ink_underlines`, `tonal_pivot_sparkles` | **Clean Read Mode** | **Sensory View On** |
| `HS_ACT1_MENTOR_STEP1` | Inline Editor | Act I (0) | **Yes** | `mentorship_badges` | **Title your Remembrance** (✓) | **Title your Remembrance** (1) |
| `HS_ACT1_MENTOR_STEP2` | Inline Editor | Act I (0) | **Yes** | `mentorship_badges` | **Cast the Story Hook** (✓) | **Cast the Story Hook** (2) |
| `HS_ACT1_MENTOR_STEP3` | Dock Hero | Act I (0) | **Yes** | `mentorship_badges` | **Seal & Weave Monologue** (✓) | **Seal & Weave Monologue** (3) |
| `HS_ACT2_MENTOR_STEP1` | Stage Canvas | Act II (1) | **Yes** | `mentorship_badges` | **Select AI Vision Style** (✓) | **Select AI Vision Style** (1) |
| `HS_ACT2_MENTOR_STEP2` | Stage Canvas | Act II (1) | **Yes** | `mentorship_badges` | **Calibrate Teleprompter Speed** (✓) | **Calibrate Teleprompter Speed** (2) |
| `HS_ACT2_MENTOR_STEP3` | Dock Hero | Act II (1) | **Yes** | `mentorship_badges` | **Launch Recording Studio** (✓) | **Launch Recording Studio** (3) |
| `HS_ACT3_MENTOR_STEP1` | Stage Canvas | Act III (2) | **Yes** | `mentorship_badges` | **Position Camera & Check Mic** (✓) | **Position Camera & Check Mic** (1) |
| `HS_ACT3_MENTOR_STEP2` | Stage Canvas | Act III (2) | **Yes** | `mentorship_badges` | **Record Your Monologue** (✓) | **Record Your Monologue** (2) |
| `HS_ACT3_MENTOR_STEP3` | Dock Hero | Act III (2) | **Yes** | `mentorship_badges` | **Finalize Footage & Submit Take** (✓) | **Finalize Footage & Submit Take** (3) |
| `HS_ACT4_MENTOR_STEP1` | Stage Canvas | Act IV (3) | **Yes** | `mentorship_badges` | **Preview Recorded Takes** (✓) | **Preview Recorded Takes** (1) |
| `HS_ACT4_MENTOR_STEP2` | Stage Canvas | Act IV (3) | **Yes** | `mentorship_badges` | **Select Master Take & Retake** (✓) | **Select Master Take & Retake** (2) |
| `HS_ACT4_MENTOR_STEP3` | Dock Hero | Act IV (3) | **Yes** | `mentorship_badges` | **Prepare Premiere Cut** (✓) | **Prepare Premiere Cut** (3) |
| `HS_ACT5_MENTOR_STEP1` | Stage Canvas | Act V (4) | **Yes** | `mentorship_badges` | **Stream to Living Room TV** (✓) | **Stream to Living Room TV** (1) |
| `HS_ACT5_MENTOR_STEP2` | Stage Canvas | Act V (4) | **Yes** | `mentorship_badges` | **Export Autobiography PDF** (✓) | **Export Autobiography PDF** (2) |
| `HS_ACT5_MENTOR_STEP3` | Dock Hero | Act V (4) | **Yes** | `mentorship_badges` | **Share Cinema Package** (✓) | **Share Cinema Package** (3) |

---

## 🛡️ Mandatory Pre-Flight Checklist for AI Code Modifications

Before submitting ANY pull request or applying code modifications to Studio components (`ProductionDeck`, `ProductionControlBar`, `MemoryForm`, `SoloStage`, `SentenceWrapper`, `MentorshipHotspot`):

1. **Verify Target Binding**: Does the modified control specify a valid telemetry `hotspotId` (`data-hotspot-id="HS_..."`) registered in `STUDIO_CONTROL_MATRIX`?
2. **Check Multi-Layer Synchronization**: Does modifying this control state update ALL affected layers defined in `affectedLayers` in unison?
3. **Verify Lock Integrity**: Ensure that Picture Locking (`isProductionLocked === true`) DOES NOT silently hide or unmount `Clean Read Mode` buttons or `MentorshipHotspots`.
4. **Enforce Mandatory UK English**: Labels MUST strictly use UK English (`Colour`, `Favourite`, `Remembrance`, `Monologue`).
5. **Run Matrix Permutation Suite**: Run `npx vitest run src/test/studio_control_matrix.test.tsx` to verify all 20 state permutations pass.

---

## 🧪 20-State Permutation Matrix Formula

$$\text{5 Stages (Acts I–V)} \times \text{2 CleanView States (True/False)} \times \text{2 Lock States (True/False)} = 20 \text{ State Permutations}$$

The automated regression shield verifies that under all 20 permutations:
- `Clean Read Mode Active` (`isCleanView === true`) hides all `mentorship_badges` and `sentence_anchors`.
- `Sensory View Active` (`isCleanView === false`) displays all active stage hotspots regardless of lock state.
- Stage navigation accurately limits step 1, 2, and 3 hotspots to their designated stage.
