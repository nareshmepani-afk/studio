> **Lesson:** When a primary dependency (`react-beautiful-dnd`) is found to be deprecated or incompatible, do not force its installation with flags like `--legacy-peer-deps`. Instead, immediately halt and pivot to a modern, well-supported alternative (e.g., `dnd-kit`). Propose this change to the user, explaining the long-term benefits of a healthier dependency tree. The use of deprecated libraries is a direct threat to project maintainability and is to be avoided at all costs.

### Lesson: Respect Framework Instability and Defer to Specific Expertise

**Scenario:** When working with bleeding-edge, alpha, or canary versions of frameworks (e.g., Next.js 16), the likelihood of encountering undocumented issues, bugs, and incompatibilities with deployment platforms is extremely high.

**Anti-Pattern:** Do not attempt to force a workaround or "hack" a fix for an unstable framework version. Persisting with a flawed approach in the face of repeated, identical failures is a failure of Humble Inquiry.

**Protocol:**
1.  **Identify Instability:** If a framework version is identified as experimental or is causing build/deployment issues that standard solutions do not solve, it must be treated as the primary suspect.
2.  **Prioritize Downgrading:** The most robust and reliable solution is to downgrade to the latest stable version of the framework. This is not a workaround; it is the correct engineering decision.
3.  **Defer to User Expertise:** If the user identifies the instability and suggests downgrading, that directive must be followed immediately without attempting alternative, less-certain fixes.
### Lesson: The Principle of Systemic Verification

**Scenario:** A series of cascading build failures occurred. A fix was applied to one file, only for the same error to appear in another. An environment-specific configuration was applied to production, but the local environment was ignored. A simple syntax error broke the final build after complex fixes were applied.

**Anti-Pattern:** Do not treat an error as a localized problem. A single error is often a symptom of a systemic issue. Fixing one instance without investigating the entire system is an invitation for repeated, frustrating failures.

**Protocol: The Systemic Verification Check**
After any fix, and before declaring the work complete, I must perform the following mandatory, non-negotiable check:

1.  **Global Search:** For any error related to a dependency, import, or specific function call, I will perform a global search across the entire codebase to identify and correct *all* similar instances in a single commit.
2.  **Environmental Review:** I will explicitly consider all target environments (`local`, `staging`, `production`). I will ask myself, "Does this fix apply to all environments? What other files (`.env`, `apphosting.yaml`, etc.) need to be changed to ensure consistency across them?"
3.  **Final Syntax Sweep:** Before finalizing the `<changes>` block, I will perform a final, meticulous review of only the changed lines for basic syntax errors, typos, or unclosed elements. This is a final "self-linting" step to prevent careless mistakes.

### Lesson: The Dependency Health Check Protocol

**Scenario:** A sprint focused on dependency *performance* was derailed by the discovery of a critical *security* vulnerability, forcing a reactive "Mosh Pit" to resolve it.

**Anti-Pattern:** Analyzing project dependencies along a single axis (e.g., size, functionality) while ignoring other critical health metrics like security. Treating `npm audit` as a reactive tool used only when an error appears.

**Protocol: The Dependency Health Check**
Henceforth, any task involving the analysis or modification of `package.json` is to be considered a full **Dependency Health Check**. This is a non-negotiable protocol that broadens the scope of "Humble Inquiry" for dependencies. The check MUST include:

1.  **Performance Analysis:** Identify "heavy" packages that are candidates for dynamic imports or lazy loading.
2.  **Security Audit:** Run `npm audit` to proactively identify and assess vulnerabilities.
3.  **Deprecation Check:** Review key dependencies for deprecation notices.
4.  **Holistic Plan:** The action plan presented to the Principal Witness must address all three areas. A plan to optimize performance is incomplete if it ignores a known security vulnerability.

This protocol transforms dependency management from a reactive, piecemeal process into a proactive, holistic practice, ensuring we maintain a secure, performant, and stable foundation.