# State Synchronization Map

This document outlines the data flow and state management for the Role-Specific Production Suites.

## 1. Firestore Data Model (Single Source of Truth)

**Collection:** `studio`
**Document:** `{sessionId}`

| Field | Type | Description |
|---|---|---|
| `hostId` | `string` | UID of the user who created the session. |
| `participants`| `Map[]` | Array of participant objects. |
| `participants.uid` | `string`| UID of the participant. |
| `participants.role`| `string`| Role of the participant (`Interviewer`, `Storyteller`, `Guest`). |
| `participants.lastSeen` | `timestamp` | "Heartbeat" to show "Online/Offline" status in the Command Center. |
| `isRecording` | `boolean`| Global recording status. |
| `activePromptId`| `string` | The ID of the prompt currently on "The Stage". |
| `queuedPromptId`| `string` | The next prompt the Interviewer is preparing (Pre-caches on The Stage). |
| `mode` | `string` | Current studio mode (`solo`, `interview`, etc.). |
| `sessionSecretHash` | `string` | Security: For validating the GUEST_SESSION_SECRET without exposing it. |
| `timerValue` | `number` | The active countdown for the "Pass Active" feature. |
| `completedPrompts`| `string[]`| Array of completed prompt IDs. |


## 2. Role-Based Actions (State Mutators)

| Role | Action | Firestore Update | Server Action |
|---|---|---|---|
| **Host** | Start/Stop Recording | `isRecording` | `toggleRecording(sessionId)` |
| **Interviewer**| Push Prompt to Stage | `activePromptId`| `setPrompt(sessionId, promptId)` |
| **Interviewer**| Queue Next Prompt | `queuedPromptId`| `queuePrompt(sessionId, promptId)` |
| **Storyteller**| Mark Prompt as Complete | `completedPrompts` (arrayUnion) | `completePrompt(sessionId, promptId)` |


## 3. UI Component Data Dependencies

| UI Suite | Component | Data Dependency | Description |
|---|---|---|---|
| **Command Center** | `HostView` | `isRecording`, `participants` | Displays recording status and participant health. |
| **The Deck** | `InterviewerView` | `isRecording` | Enables/disables controls based on recording status. |
| **The Stage** | `StorytellerView` | `activePromptId`, `queuedPromptId` | Displays the active prompt and pre-caches the next one. |
| **The Gallery** | `GuestView` | `activePromptId`, `isRecording` | Shows the current topic and recording status. |


## 4. Conflict Resolution & Hierarchy

To prevent state conflicts from simultaneous actions, the following hierarchy is enforced:

1.  **Host Actions:** Session-level actions (e.g., `isRecording`, `timerValue`) initiated by the Host override any other state change.
2.  **Interviewer Actions:** Prompt-related actions (`activePromptId`, `queuedPromptId`) override Storyteller or Guest views.
3.  **Storyteller/Guest Actions:** These are typically additive (e.g., adding to `completedPrompts`) and do not override core session state.

## 5. Fetch-First Pre-Caching Strategy (STU-55)

The Storyteller's "Stage" UI uses the `queuedPromptId` to implement a "Fetch-First" strategy.

1.  **The Deck (Interviewer):** When the Interviewer selects a prompt to prepare, the UI calls the `queuePrompt` server action, updating the `queuedPromptId` in Firestore.
2.  **The Stage (Storyteller):** A listener on `queuedPromptId` triggers a background fetch for the prompt's assets (Ghost Cards, etc.).
3.  **"Push to Stage":** When the Interviewer clicks "Push," the `setPrompt` action updates `activePromptId`. The assets are already cached on the client, resulting in an instantaneous UI update for the Storyteller.

## 6. Firestore Security Rules Concept

Rules must be granular to enforce role-based permissions.

```javascript
// Example Security Concept
match /studio/{sessionId} {
  // Host has full control
  allow read, write: if request.auth.uid == resource.data.hostId;

  // Participants can read the session state
  allow read: if request.auth.uid in resource.data.participants.keys();

  // Interviewer can update prompt-related fields
  function isInterviewer() {
    return resource.data.participants[request.auth.uid].role == 'Interviewer';
  }
  allow update: if isInterviewer() && (request.resource.data.activePromptId != resource.data.activePromptId || request.resource.data.queuedPromptId != resource.data.queuedPromptId);

  // Storyteller can update their completed prompts
  function isStoryteller() {
    return resource.data.participants[request.auth.uid].role == 'Storyteller';
  }
  allow update: if isStoryteller() && request.resource.data.completedPrompts.size() == resource.data.completedPrompts.size() + 1;
}
```