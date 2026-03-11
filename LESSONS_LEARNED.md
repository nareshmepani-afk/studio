#  Lessons Learned & Internal Processes

This document tracks key learnings and standard operating procedures to improve development efficiency and avoid repeating mistakes.

## 1. Firebase Deployment Strategy

*   **Lesson:** `classic_firebase_hosting_deploy` is ONLY for static client-side applications.
*   **Process:** For server-rendered applications like Next.js, we MUST use **Firebase App Hosting**. 

## 2. Server-Side Environment Variable Parsing

*   **Lesson:** Environment variables, especially complex ones like JSON, can be malformed when injected into the build/runtime environment.
*   **Process:** Always use a robust parsing function to sanitize and validate critical environment variables at application startup.

## 3. Dependency Management for Server-Side Libraries

*   **Lesson:** Libraries used in Server Actions or API routes (like `firebase-admin`) MUST be in `dependencies`, not `devDependencies`. App Hosting will not include them in the production bundle otherwise, leading to "Module not found" or "Internal Server Error".

## 4. Module Resolution and Exports

*   **Lesson:** Build workers can be sensitive to files lacking default exports when imported via aliases.
*   **Process:** Ensure shared hooks (like `use-toast`) provide both named and default exports to satisfy different import styles across components and libraries.

## 5. React 19 and TypeScript 15

*   **Lesson:** Next.js 15 requires `@types/react` and `@types/react-dom` to be at least version 19 to match the installed React version. Version mismatches lead to cryptic build failures in the rollout phase.

```
