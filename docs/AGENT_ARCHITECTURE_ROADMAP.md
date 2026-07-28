# 🎬 Chronicle Cinema / Memory Weaver — Agent Architecture & Strategic Roadmap

> **Status**: ARCHIVED FOR PHASE 2 (POST-v1.0)  
> **Author**: Antigravity, User & Gemini Partner Architecture Team  
> **Last Updated**: 2026-07-28  

---

## 🏛️ Executive Summary & Roadmap Guardrails

Memory Weaver's core philosophy is **unrestricted performer flow state** (*Zuhandenheit*). 

- **Phase 1 (NOW — v1.0 Release Stack)**: 
  - Leverage **Stateless, Zod-Validated Server Actions** (`src/actions/aiWeaver.ts` via Genkit & Gemini).
  - Guarantee 0ms optimistic UI transitions, deterministic state management, and 100% performer control.
  - Complete the `MW-12` → `MW-16` Staging Verification Sweep on `dev.memoryweaver.studio`.

- **Phase 2 (LATER — Post-v1.0 Experimental Spike)**:
  - Branch: `experimental/agent-guest-director`
  - Introduce **Autonomous Virtual Studio Crew Members** (AI Guest Director & Real-Time Score Curator) using Gemini Multimodal Live API over WebRTC.

---

## 🔍 Core Technical Distinction

| Dimension | Phase 1: Server Actions (`aiWeaver.ts`) | Phase 2: Autonomous Agents (WebRTC Live) |
| :--- | :--- | :--- |
| **Execution Trigger** | Synchronous button / lifecycle event | Continuous real-time perception loop |
| **State Context** | Stateless payload input → Zod JSON output | Stateful goal context across entire session |
| **Latency** | Single-shot (100ms–800ms) | Low-latency stream (WebRTC audio/video) |
| **Role** | Script drafting, polish, synthesis | Conversational co-host, live score ducking |
| **Performer Control** | 100% Deterministic & Explicit | Proactive coaching / sideline support |

---

## 🎬 Phase 2 Agent Roles Blueprint

### 1. 🎭 The AI Guest Director (Conversational Oral History Co-Host)
- **Problem**: Users recording legacy memoirs at home are often alone facing a camera, leading to self-consciousness or robotic delivery.
- **Solution**: An AI Guest Director connected via **Gemini Multimodal Live API over WebRTC**:
  - **Perceives**: Monitors camera feed, vocal pauses, and emotional tones.
  - **Action**: Interjects during silences with warm, sensory probing questions:
    > *"You mentioned your granddad's hands stained with Kutch soil... when you close your eyes, what did the air smell like at sunrise in that village?"*
  - **Impact**: Transforms solitary video recording into a live, two-way documentary interview.

### 2. 🎵 The Real-Time Score & Optics Curator
- **Problem**: Background audio pads generated statically do not adjust if the performer speaks faster, slower, or pauses emotionally.
- **Solution**: A background audio-video curator agent:
  - **Perceives**: Analyzes real-time vocal cadence and pitch intensity.
  - **Action**: Dynamically ducks background music under spoken dialogue, swells string pads during climaxes (*Hero Moments*), and cues subtle visual monitor shifts (*"Warm Emerald Accent"*).

---

## 🛡️ The Non-Negotiable Immersion Guardrail

> ⚠️ **MANDATE**: An AI Agent must **NEVER** alter teleprompter text, force UI layout shifts, or mutate state while a performer is actively standing in front of the lens reading or recording.
>
> **The Performer Commands the Stage; The AI Crew Supports from the Sidelines.**

---

## 🗺️ Execution Timeline

```
  [ Phase 1: NOW (v1.0 Release) ]        │    [ Phase 2: LATER (Post-v1.0) ]
  • Deterministic Server Actions        │    • Experimental Branch: feature/agent-guest-director
  • Scriptorium Immutability Shield     │    • Gemini Multimodal Live API over WebRTC
  • 3D Cover Flow Carousel              │    • Real-Time Conversational AI Guest Director
  • Staging Pass (MW-12 ──► MW-16)      │    • Dynamic Audio & Visual Score Ducking
```
