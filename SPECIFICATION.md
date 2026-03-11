# SPECIFICATION: The Living Memory of Memory Weaver

## 0. Guiding Principle: The Development Duet
The Development Duet is a symbiotic collaboration between the Principal Witness (the User) and the AI Tech Lead. We aim for:
- **Creativity**: Weaving innovative solutions and evocative storytelling.
- **Critical Thinking**: Rigorous logic and architectural integrity.
- **Memory and Metacognition**: Learning from every sprint and reflecting on our own processes.
- **Higher quality work**: Striving for excellence in every line of code.
- **Right questions**: Asking the deep questions that reveal the core of the task.
- **Explore the unknown**: Venturing into new technical and narrative territories.

## 1. The Ontology (The "Why")
Memory Weaver exists to bridge generations through the power of recorded story. It transforms fleeting moments into a lasting legacy.

## 2. Tech Stack (The Tools)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **Database/Auth**: Firebase Firestore & Authentication
- **AI**: Genkit (Gemini Flash)
- **Video**: @ffmpeg/ffmpeg for client-side processing

## 3. Data Structure (The Being)
- `/users/{userId}`: Profiles, host pass status, storage metrics.
- `/users/{userId}/memories/{memoryId}`: The core data entity.
- `/studio/{sessionId}`: Real-time synchronization for remote control sessions.

## 4. Current Horizon (The State of Being)
- **Ready-to-Hand**: A functional recording studio with remote control capabilities and a guided "Life Journey" prompt system.
- **Successful Deployment**: The application is configured for Firebase App Hosting.

## 5. Manual Testing Protocol (The Witnessing)
All features must be validated through the E2E (End-to-End) protocol documented in `MANUAL_TESTING.md`.

## 6. Sprint-Based Workflow
- Work is committed directly to the `master` branch.
- No complex branching is used for this two-person duet.

## 7. Change Log (A History of Poiesis)
- Refactored `use-toast` to resolve module resolution errors.
- Standardized component imports in `PromptsPageContent.tsx` using absolute aliases.
- Integrated core principles: Creativity, Critical Thinking, Memory, and Metacognition.
- Simplified `add-memory` page to use the modern Studio component.

## 8. On-Screen Mobile Debugging Framework (The Lens)
In-app console for real-time log inspection on mobile devices.

## 9. The AI Tech Lead Performance Protocol (The Mirror)
### 9.1 Performance Metrics
- **Clean Room**: Flawless execution.
- **Mosh Pit**: Cascading errors requiring intervention.

### 9.2 Performance Log
- **[2024-05-26] Ugly**: Repeatedly failed to resolve `use-toast` module errors due to incomplete refactoring. The process was inefficient and reactive.

## 10. The App Hosting Mandate (NON-NEGOTIABLE DEPLOYMENT DIRECTIVE)
This is a server-side Next.js application. It **MUST** be deployed using **Firebase App Hosting**. Classic static hosting is strictly forbidden.
