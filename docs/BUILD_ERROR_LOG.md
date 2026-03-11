# Build Resolution & Deployment Guide

## Current Status
The "Mosh Pit" was caused by a naming conflict between `src/types.ts` and `src/types/index.ts`, coupled with a directory collision between the local `workspace/` folder and the CI root.

## Resolution Steps
1. **Unified Types:** All type definitions have been moved to `src/types/index.ts`.
2. **Standardized Hooks:** `use-toast.ts` has been verified as a valid ES module.
3. **Correct Backend ID:** The manual rollout command must use `studio`, not `nextn`.

## Deployment Command
Use this command to manually force a rollout:

```bash
firebase apphosting:rollouts:create studio --project memory-weaver-8rk9t
```

## Troubleshooting
If the build still fails with "not a module", ensure the `workspace/` directory is not being tracked by git or rename it locally to avoid collision with the build container's path.
