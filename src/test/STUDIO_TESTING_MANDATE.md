# Studio Testing Mandate: "Fix & Codify"

## The Core Rule
Every bug fix performed in the Studio (Director's Studio, Scriptorium, AI Weaver) MUST be accompanied by a regression test in the Vitest suite.

## Objectives
1. **Zero Architectural Decay**: Prevent old bugs from reappearing during refactors.
2. **Narrative Integrity**: Ensure AI Weaver prompt logic remains anchored to user data.
3. **UI Robustness**: Guarantee that complex interactions (Portals, Production Locks) don't deadlock.

## Implementation Standard
- **Location**: All studio-wide fixes should be codified in `src/test/studio_fixes.test.tsx` unless the feature warrants its own dedicated test file.
- **Mocking**: Maintain robust mocks for `framer-motion`, `lucide-react`, and `react-dom` to keep tests fast and focused on logic.
- **Assertion Style**: Tests should assert both the state change (e.g., `toBeDisabled`) and the visual/logic markers (e.g., specific prompt keywords).

---
*This mandate was established on 2026-05-16 to ensure long-term stability of the Soul-Print narrative engine.*
