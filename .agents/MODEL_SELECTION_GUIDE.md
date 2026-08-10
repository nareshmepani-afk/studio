# Rule: Model Selection Advisory Protocol

After answering the user's question or before beginning execution, the agent MUST include a **Model Advisory** recommendation specifying which model the user should use for the NEXT interaction based on the task type.

---

## Model Tier Definitions

| Model | Tier | Cost | Best For |
|---|---|---|---|
| **Gemini 3.6 Flash (Low)** | 💚 Economy | Lowest | Quick lookups, simple grep searches, reading files, status checks, git operations, running commands |
| **Gemini 3.6 Flash (Medium)** | 💛 Standard | Low | Single-file bug fixes, CSS tweaks, copy changes, test runs, small refactors, deployment monitoring |
| **Gemini 3.6 Flash (High)** | 🟠 Enhanced | Medium | Multi-file feature implementation, component creation, standard debugging, build pipeline work |
| **Claude Sonnet 4.6 (Thinking)** | 🔴 Premium | High | Complex multi-file architectural changes, state machine debugging, cross-component state flow tracing, intricate UI/UX logic |
| **Claude Opus 4.6 (Thinking)** | 🟣 Ultra | Highest | Deep architectural decisions, system design brainstorming, root cause analysis of systemic failures, USCR-level registry creation, multi-agent orchestration planning |

---

## Decision Matrix

### 💚 Use **Gemini Flash (Low)** when:
- Checking build/deploy status
- Running `git log`, `git status`, `git diff`
- Reading a single file to check current state
- Simple "what does X do?" lookups
- Running `tsc --noEmit` or `vitest` checks
- Viewing Plane.so tickets or Firebase logs

### 💛 Use **Gemini Flash (Medium)** when:
- Fixing a single CSS styling issue (colours, spacing, fonts)
- Changing button labels or copy text
- Adding a single import or fixing a missing variable
- Running and interpreting test results
- Simple single-component tweaks (< 20 lines changed)
- Committing and pushing changes

### 🟠 Use **Gemini Flash (High)** when:
- Implementing a new UI component from scratch
- Multi-file bug fix requiring 2–4 file changes
- Adding new props/handlers across parent-child components
- Writing new test suites
- Standard feature development (new page, new hook, new API route)
- Build error resolution across multiple files

### 🔴 Use **Claude Sonnet (Thinking)** when:
- Debugging state flow across 3+ interconnected components
- Tracing why a button/control disappears (cross-component visibility logic)
- Complex conditional rendering with multiple interacting state variables
- Refactoring hooks with dependency arrays and side effects
- Performance optimisation requiring deep code analysis
- Multi-step fix requiring research → diagnosis → implementation → verification

### 🟣 Use **Claude Opus (Thinking)** when:
- Architectural design decisions (USCR registry, control matrices, state machines)
- Brainstorming sessions requiring creative product thinking
- Root cause analysis of systemic/recurring failures
- Creating new architectural rules or `.agents/` rulebooks
- Complex multi-agent orchestration or planning sessions
- Tasks where previous models failed or produced incorrect results
- When the user explicitly says "think deeply" or "brainstorm"

---

## Advisory Format

At the end of every response, include:

```
---
📊 **Model Advisory for Next Interaction:**
[Emoji] **[Model Name]** — [One-line reason]
```

### Examples:

```
📊 **Model Advisory for Next Interaction:**
💛 **Gemini Flash (Medium)** — Simple CSS colour fix, single file change.
```

```
📊 **Model Advisory for Next Interaction:**
🔴 **Claude Sonnet (Thinking)** — Cross-component state debugging across ProductionDeck, MemoryForm, and SoloStage.
```

```
📊 **Model Advisory for Next Interaction:**
💚 **Gemini Flash (Low)** — Just checking deploy status and reading logs.
```

---

## Escalation Rules

1. **If a task fails on a lower-tier model**, recommend upgrading one tier for the retry.
2. **If the user reports API overload errors**, recommend switching to the alternate provider (Gemini ↔ Claude).
3. **Never recommend Opus for tasks that Sonnet can handle** — respect the user's budget.
4. **When in doubt, recommend Sonnet** — it handles 80% of real development tasks well.
5. **Always recommend Flash (Low) for follow-up verification** after a fix is deployed (checking staging, reading logs, confirming status).
