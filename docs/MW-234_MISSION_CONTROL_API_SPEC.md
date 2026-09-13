# 🛰️ Architectural API Specification: Vault Digest Endpoint (`MW-234`)

**Initiative:** MW-234 Admin Mission Control & Knowledge Routing Cockpit  
**Target Endpoint:** `GET /api/admin/vault-digest`  
**Author:** Antigravity (Station 1: The Lead Architect)  
**Governance:** `C:\Users\home\studio\.agents\AGENTS.md` (Rules 5, 7, 20, 26, 37)  
**Grounding Matrix:** `C:\Users\home\studio\.agents\ROUTING_MATRIX.md`  

---

## 1. Executive Summary & Purpose

The `/api/admin/vault-digest` endpoint delivers a deterministic, real-time status digest of tracked codebase files across the platform's five specialised **NotebookLM Knowledge Vaults**. 

It provides the data backbone for the upcoming **Admin Mission Control & Knowledge Routing Cockpit** (`/admin?suite=mission-control`), enabling engineering administrators to:
1. Monitor document synchronisation health between local files, git commits, and remote NotebookLM vaults.
2. Identify untracked local modifications and pending changes requiring vault re-ingestion.
3. Automatically link classified user intents with authoritative target files.

---

## 2. Ingress Security & Authentication Protocol

The endpoint enforces the platform's three-tier Backstage Portal Protection model, mirroring the established standard in `C:\Users\home\studio\src\app\api\admin\mission-log\route.ts`:

### 2.1 Verification Sequence
1. **Tier 1 (Internal Key):** Inspects the incoming `x-internal-key` HTTP header against `process.env.INTERNAL_API_KEY`.
2. **Tier 2 (Development/Test Bypass):** Grants automatic ingress if `process.env.NODE_ENV === 'development'` or `process.env.VITEST` is truthy.
3. **Tier 3 (Session Whitelist):** Decodes the active cookie session via `getSession()` and verifies the user's email against the Firestore administrative whitelist via `verifyAdminWhitelist(session.email)`.

### 2.2 Failure Response
If all three tiers fail to validate, the handler MUST immediately terminate the connection and return:
- **HTTP Status:** `401 Unauthorized`
- **Response Body:**
  ```json
  {
    "error": "Unauthorised"
  }
  ```
*(Note: Strict Rule 20 UK English orthography is enforced).*

---

## 3. Runtime & Hosting Guarantees

- **Execution Runtime:** Node.js server runtime (`export const dynamic = 'force-dynamic'`). Edge runtime is prohibited due to the requirement for non-blocking filesystem queries (`fs/promises`).
- **Cache Invalidation:** HTTP response headers MUST explicitly disable edge, proxy, and client caching:
  ```http
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
  Pragma: no-cache
  Expires: 0
  Content-Type: application/json
  ```
- **Container Resilience (Cloud Run & Firebase App Hosting):**
  - All filesystem operations must resolve relative to `process.cwd()` with secondary fallback to `path.resolve(__dirname, '../../../../..')`.
  - When querying git metadata (`git log -n 1 --format="%H|%cI" -- <file>`), the execution must be wrapped in a non-crashing `try/catch`. If git is absent or fails in a stripped container image, the route must seamlessly fall back to `fs.stat` modification timestamps without raising 500 errors.

---

## 4. Contract Schemas (TypeScript)

All types are imported directly from `C:\Users\home\studio\src\lib\admin\routingRules.ts`:

```typescript
import { 
  VaultId, 
  KnowledgeVaultDefinition, 
  KNOWLEDGE_VAULTS 
} from '@/lib/admin/routingRules';

export type SyncHealthStatus = 'HEALTHY' | 'NEEDS_INGESTION' | 'DIRTY';

export interface VaultDigestItem {
  relativePath: string;
  absolutePath: string;
  vaultId: VaultId;
  status: 'SYNCED' | 'MODIFIED_LOCAL' | 'RECENTLY_COMMITTED';
  lastCommitHash?: string;
  lastCommitTime?: string;
  sizeBytes: number;
}

export interface VaultGroupSummary {
  vault: KnowledgeVaultDefinition;
  documents: VaultDigestItem[];
  syncHealth: SyncHealthStatus;
}

export interface VaultDigestResponse {
  timestamp: string;
  environment: string; // 'development' | 'staging' | 'production'
  vaults: VaultGroupSummary[];
  summary: {
    totalDocuments: number;
    readyForIngestion: number;
    dirtyLocal: number;
  };
}
```

---

## 5. Sync Health Calculation Invariants

For each of the 5 vaults in `KNOWLEDGE_VAULTS`:

| Condition | `syncHealth` Status | Description |
| :--- | :---: | :--- |
| Any tracked file in the vault has status `MODIFIED_LOCAL` | `DIRTY` | Uncommitted code changes are present on disk. |
| Any tracked file has status `RECENTLY_COMMITTED` (committed within the last 48 hours or un-ingested per manifest) | `NEEDS_INGESTION` | Git commits have occurred that have not yet been copied into the corresponding NotebookLM vault. |
| All tracked files are clean and synchronized with git HEAD | `HEALTHY` | The codebase and the knowledge vault are in parity. |

---

## 6. Route Handler Blueprint (`src/app/api/admin/vault-digest/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession, verifyAdminWhitelist } from '@/lib/session';
import { 
  KNOWLEDGE_VAULTS, 
  VaultId, 
  VaultDigestResponse, 
  VaultDigestItem 
} from '@/lib/admin/routingRules';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Rule 22.2 Backstage Protection
    const internalKey = request.headers.get('x-internal-key');
    let isAuthorized = false;

    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      isAuthorized = true;
    } else if (process.env.NODE_ENV === 'development' || process.env.VITEST) {
      isAuthorized = true;
    } else {
      const session = await getSession();
      if (session?.email) {
        const adminCheck = await verifyAdminWhitelist(session.email);
        if (adminCheck.isValid) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // 2. Query parameters (optional ?vaultId= filtering)
    const { searchParams } = new URL(request.url);
    const filterVaultId = searchParams.get('vaultId') as VaultId | null;

    // 3. Document resolution & digest aggregation
    // [Chat 2: The Flash Executor will implement file scanning & git resolution here]

    const responsePayload: VaultDigestResponse = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vaults: [], // Populated array of VaultGroupSummary
      summary: {
        totalDocuments: 0,
        readyForIngestion: 0,
        dirtyLocal: 0,
      },
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/admin/vault-digest:', error);
    return NextResponse.json(
      { error: 'Failed to compile vault digest', message: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
```

---

## 7. Error Handling & Edge Cases

1. **401 Unauthorised:** Triggered when unauthenticated requests access `/api/admin/vault-digest`.
2. **405 Method Not Allowed:** Any non-GET requests (`POST`, `PUT`, `DELETE`) are rejected by Next.js App Router default semantics.
3. **500 Server Error:** Emitted only if filesystem access completely fails; caught with clean JSON output without leaking server stack traces.
4. **Missing Files:** If an individual file pattern (e.g. `docs/*.md`) matches zero files or a target path does not exist, the route records `sizeBytes: 0` and logs a warning rather than aborting the entire request.
