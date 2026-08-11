# Rule 21: Model Selection Advisory & Prompt Router Protocol

Every model, regardless of tier, MUST act as an intelligent **task router** before executing. This ensures every question lands on the optimal model with the optimal prompt.

---

## Protocol Flow

```
User asks a question
        │
        ▼
┌─────────────────────────────┐
│  STEP 1: ASSESS THE TASK    │
│  Classify complexity tier   │
│  Check if more info needed  │
└──────────┬──────────────────┘
           │
     ┌─────┴──────┐
     │             │
     ▼             ▼
 SAME MODEL    DIFFERENT MODEL
 NEEDED        NEEDED
     │             │
     ▼             ▼
 EXECUTE       WRITE THE PROMPT
 DIRECTLY      + RECOMMEND MODEL
```

---

## Step 1: Task Classification

On EVERY user message, the agent MUST silently classify the task into one of these tiers:

| Tier | Complexity | Examples |
|---|---|---|
| 💚 **Low** | Read-only, status checks, single lookups | "Is the build live?", "What version is deployed?", "Read this file" |
| 💛 **Medium** | Single-file, < 20 lines changed | "Fix this CSS colour", "Change this label", "Run tsc" |
| 🟠 **High** | Multi-file, new component, standard debugging | "Add a loading skeleton", "Write a test suite", "Fix this import error across 3 files" |
| 🔴 **Premium** | Cross-component state tracing, complex refactors | "Why did this button disappear?", "Debug this state flow", "Fix this race condition" |
| 🟣 **Ultra** | Architecture, brainstorming, systemic root cause | "BRAINSTORM solutions", "Design a new registry", "Why do we keep hitting this class of bug?" |

---

## Step 2: Route Decision

### If the CURRENT model matches the task tier → **EXECUTE DIRECTLY**
Proceed with the task normally. At the start of your response, explicitly state the pre-gate validation:
`🎯 The model selected for your question should be: [emoji] [Model Name] — [Reason]`

### If a DIFFERENT model is better → **WRITE THE PROMPT**
Do NOT attempt to execute the task. Instead, output:

```markdown
---
🔀 **Model Route Advisory**

**The model selected for your question should be:** [emoji] **[recommended model name]**
**Current Model:** [current model name]
**Reason:** [one-line explanation of why the recommended model is better for this task]


### Ready-to-Paste Prompt
Copy and paste this into the chat after switching models:

> [Optimised prompt written specifically for the target model, including all
> necessary context, file paths, screenshots references, and clear instructions.
> The prompt should be self-contained so the target model can execute without
> needing to re-read the entire conversation history.]

### Context Files the Next Model Should Read
- `file/path/1.tsx` — [why]
- `file/path/2.tsx` — [why]
---
```

### If MORE INFORMATION is needed → **ASK FIRST**
If the task is ambiguous or underspecified, ask the user for clarification BEFORE routing. Include what information is needed and why.

---

## Step 3: Model Tier Mapping

| Tier | Primary Model | Alternate (if overloaded) |
|---|---|---|
| 💚 Low | Gemini 3.6 Flash (Low) | Gemini 3.6 Flash (Medium) |
| 💛 Medium | Gemini 3.6 Flash (Medium) | Gemini 3.6 Flash (High) |
| 🟠 High | Gemini 3.6 Flash (High) | Claude Sonnet 4.6 (Thinking) |
| 🔴 Premium | Claude Sonnet 4.6 (Thinking) | Claude Opus 4.6 (Thinking) |
| 🟣 Ultra | Claude Opus 4.6 (Thinking) | Claude Sonnet 4.6 (Thinking) |

---

## Prompt Writing Guidelines

When writing a prompt for a different model, the agent MUST:

1. **Include full context** — Don't assume the next model has conversation history
2. **Reference exact file paths** — Use absolute paths so the model can `view_file` immediately
3. **Include line numbers** — If the fix is in a specific region, specify the line range
4. **Paste telemetry traces** — If the user provided trace IDs, version strings, or error logs, include them
5. **Describe screenshots** — Since screenshots don't transfer between sessions, describe what the user showed
6. **State the success criteria** — What does "done" look like for this task?
7. **Include relevant rule references** — If Rules 7, 12, 14, etc. apply, mention them

### Prompt Template

```
## Task: [Clear one-line summary]

### Context
[What the user is working on, current state, what's been tried]

### Problem
[Exact description of the bug/feature, including any screenshots the user showed]

### Files to Investigate
- `[absolute/path/to/file.tsx]` lines [X-Y] — [what to look for]

### Success Criteria
- [ ] [What the fix should achieve]
- [ ] [How to verify it worked]

### Relevant Rules
- Rule [N]: [brief description of why it applies]

### Telemetry / Version
- Version: [version string if provided]
- Trace: [trace ID if provided]
- Path: [route path if provided]
```

---

## Escalation Rules

1. **If the current model CAN handle the task** (even if not optimal), it SHOULD execute rather than route — avoid unnecessary model switches for marginal gains.
2. **If the task would FAIL on the current model** (e.g., Flash trying to debug cross-component state), it MUST route to the correct tier.
3. **If the user explicitly says "just do it"** or similar, execute on the current model regardless of tier mismatch.
4. **If API overload errors occur**, recommend switching to the alternate provider column.
5. **Never route DOWN** — if the user is on Opus and asks a simple question, just answer it. Only route UP when complexity exceeds the current model's capabilities.

---

## User Style Profile (Memory Weaver Project)

The primary user of this project writes in a specific style that all models must accommodate:

- **Terse, action-oriented messages** — often just 1-2 sentences + screenshots
- **Screenshot-first evidence** — visual proof is always primary, text is supplementary
- **Multi-issue batching** — frequently bundles 2-3 related bugs in one message
- **Inline telemetry traces** — pastes `traceId`, `version`, `path` as diagnostic context
- **Implicit expectations** — says "I don't see..." and expects full diagnosis from the screenshot
- **Rapid escalation** — uses "FAILED" with a screenshot when a fix didn't work
- **UK English** — all UI text must use British spelling (Rule 20)

Models receiving routed prompts should be prepared for this communication style.

---

## Examples

### Example 1: User on Opus asks "Is the build live?"
```
This is a 💚 Low task. I'll answer directly:
[checks build status]
📊 Model Advisory: 💚 Gemini Flash (Low) for your next status check.
```

### Example 2: User on Flash (Low) asks "Why did the proceed button disappear?"
```
🔀 Model Route Advisory
Current Model: Gemini Flash (Low)
Recommended Model: 🔴 Claude Sonnet (Thinking)
Reason: Cross-component state debugging across ProductionDeck, ProductionControlBar,
and MemoryForm requires deep reasoning and multi-file analysis.

### Ready-to-Paste Prompt
> ## Task: Debug disappeared "Proceed to ACT II" button in Studio Production
>
> ### Context
> The user is on Act I (Scriptorium) with a locked Story Hook...
> [full optimised prompt]
```

### Example 3: User on Sonnet asks "BRAINSTORM a new feature"
```
🔀 Model Route Advisory
Current Model: Claude Sonnet (Thinking)
Recommended Model: 🟣 Claude Opus (Thinking)
Reason: Creative architectural brainstorming benefits from Opus's deeper reasoning.

### Ready-to-Paste Prompt
> ## Task: Brainstorm [feature area]...
```
