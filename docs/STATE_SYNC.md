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
| `isRecording` | `boolean`| Global recording status. |
| `activePromptId`| `string` | The ID of the prompt currently on "The Stage". |
| `mode` | `string` | Current studio mode (`solo`, `interview`, etc.). |

## 2. Role-Based Actions (State Mutators)

| Role | Action | Firestore Update | Server Action |
|---|---|---|---|
| **Host** | Start/Stop Recording | `isRecording` | `toggleRecording(sessionId)` |
| **Interviewer**| Push Prompt to Stage | `activePromptId`| `setPrompt(sessionId, promptId)` |
| **Storyteller**| Mark Prompt as Complete | `completedPrompts` (new field) | `completePrompt(sessionId, promptId)` |

## 3. UI Component Data Dependencies

| UI Suite | Component | Data Dependency | Description |
|---|---|---|---|
| **Command Center** | `HostView` | `isRecording`, `participants` | Displays recording status and participant health. |
| **The Deck** | `InterviewerView` | `isRecording` | Enables/disables controls based on recording status. |
| **The Stage** | `StorytellerView` | `activePromptId` | Displays the active prompt from the Interviewer. |
| **The Gallery** | `GuestView` | `activePromptId`, `isRecording` | Shows the current topic and recording status. |
