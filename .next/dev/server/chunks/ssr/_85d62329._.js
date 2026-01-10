module.exports = [
"[project]/src/lib/firebase-admin.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adminAuth",
    ()=>adminAuth,
    "adminDb",
    ()=>adminDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs, [project]/node_modules/firebase-admin)");
;
let adminDb;
let adminAuth;
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length) {
    try {
        // App Hosting provides the service account credentials via this environment variable.
        const serviceAccount = process.env.SERVICE_ACCOUNT_JSON;
        if (serviceAccount) {
            __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["initializeApp"]({
                credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["credential"].cert(JSON.parse(serviceAccount)),
                storageBucket: 'memory-weaver-8rk9t.appspot.com' // Make sure this is your correct storage bucket
            });
            console.log('[firebase-admin] Admin SDK initialized successfully.');
        } else {
            console.warn('[firebase-admin] SERVICE_ACCOUNT_JSON env var not set. SDK not initialized.');
        }
    } catch (error) {
        console.error('[firebase-admin] CRITICAL: Firebase Admin initialization failed:', error);
    }
}
if (__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length > 0) {
    adminDb = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["firestore"]();
    adminAuth = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["auth"]();
}
;
}),
"[project]/src/lib/session.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteSession",
    ()=>deleteSession,
    "getSession",
    ()=>getSession,
    "setSessionCookie",
    ()=>setSessionCookie
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-rsc] (ecmascript)");
;
;
// This function is now centralized here.
async function getAuthenticatedUser(sessionCookie) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"]) {
        throw new Error("Firebase Admin SDK is not initialized.");
    }
    try {
        const decodedToken = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"].verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        // Re-throw the original error so it can be caught and inspected by the caller.
        throw error;
    }
}
async function getSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const sessionCookie = cookieStore.get("firebase-session")?.value;
    if (!sessionCookie) return null;
    try {
        // We use the centralized verifier function
        const decodedToken = await getAuthenticatedUser(sessionCookie);
        return decodedToken;
    } catch (error) {
        console.error("Session verification failed:", error.code);
        // If Firebase says the token is expired or invalid, clear the cookie
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
            cookieStore.delete("firebase-session");
        }
        return null;
    }
}
async function setSessionCookie(sessionCookie, expiresIn) {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set("firebase-session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === "production",
        path: "/",
        sameSite: "lax"
    });
}
async function deleteSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete("firebase-session");
}
}),
"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00d38ff2ea3f621d1e67e4caa6ce7f03f8bb16059a":"deleteSessionAction","40283785d06fe4a4ff265b05f767de2bc35f02b5a1":"createSessionAction"},"",""] */ __turbopack_context__.s([
    "createSessionAction",
    ()=>createSessionAction,
    "deleteSessionAction",
    ()=>deleteSessionAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function createSessionAction(idToken) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"]) {
        console.error("[createSessionAction] Firebase Admin SDK is not initialized.");
        return {
            success: false,
            message: "Server-side authentication is not configured."
        };
    }
    try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"].createSessionCookie(idToken, {
            expiresIn
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSessionCookie"])(sessionCookie, expiresIn);
        return {
            success: true,
            message: 'Session created successfully.'
        };
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return {
            success: false,
            message: 'Could not create session: ' + error.message
        };
    }
}
async function deleteSessionAction() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSession"])();
    return {
        success: true,
        message: "Session deleted successfully."
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createSessionAction,
    deleteSessionAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createSessionAction, "40283785d06fe4a4ff265b05f767de2bc35f02b5a1", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteSessionAction, "00d38ff2ea3f621d1e67e4caa6ce7f03f8bb16059a", null);
}),
"[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"405b6c892336b174236e7cb89ca45814f2e18d424d":"getMemories","40bab11c0ac766d5a91e2dc10693e94ac6b44ad718":"getMemory","60817ca8327c0fbec584aa703a3c0237e404608b2a":"saveMemory"},"",""] */ __turbopack_context__.s([
    "getMemories",
    ()=>getMemories,
    "getMemory",
    ()=>getMemory,
    "saveMemory",
    ()=>saveMemory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function getMemories(userId) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"]) {
        throw new Error("Firestore is not initialized.");
    }
    const memoriesSnapshot = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('memories').where('userId', '==', userId).get();
    const memories = memoriesSnapshot.docs.map((doc)=>({
            id: doc.id,
            ...doc.data()
        }));
    return memories;
}
async function getMemory(memoryId) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"]) {
        throw new Error("Firestore is not initialized.");
    }
    const memoryDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('memories').doc(memoryId).get();
    if (!memoryDoc.exists) {
        return null;
    }
    return {
        id: memoryDoc.id,
        ...memoryDoc.data()
    };
}
async function saveMemory(memoryData, memoryId) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
        if (!session || session.uid !== memoryData.userId) {
            return {
                success: false,
                message: "Unauthorized or mismatched user."
            };
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"]) {
            throw new Error("Firestore is not initialized.");
        }
        if (memoryId) {
            // Update existing memory
            const memoryRef = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('memories').doc(memoryId);
            await memoryRef.update({
                ...memoryData,
                updatedAt: new Date()
            });
            return {
                success: true,
                message: 'Memory updated successfully.',
                data: {
                    id: memoryId
                }
            };
        } else {
            // Create new memory
            const newMemoryRef = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"].collection('memories').doc();
            await newMemoryRef.set({
                ...memoryData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return {
                success: true,
                message: 'Memory saved successfully.',
                data: {
                    id: newMemoryRef.id
                }
            };
        }
    } catch (error) {
        console.error("Error saving memory:", error);
        return {
            success: false,
            message: error.message
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getMemories,
    getMemory,
    saveMemory
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getMemories, "405b6c892336b174236e7cb89ca45814f2e18d424d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getMemory, "40bab11c0ac766d5a91e2dc10693e94ac6b44ad718", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveMemory, "60817ca8327c0fbec584aa703a3c0237e404608b2a", null);
}),
"[project]/.next-internal/server/app/add-memory/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$memoryActions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/.next-internal/server/app/add-memory/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00d38ff2ea3f621d1e67e4caa6ce7f03f8bb16059a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSessionAction"],
    "40283785d06fe4a4ff265b05f767de2bc35f02b5a1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSessionAction"],
    "60817ca8327c0fbec584aa703a3c0237e404608b2a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$memoryActions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveMemory"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$add$2d$memory$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$memoryActions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/add-memory/page/actions.js { ACTIONS_MODULE0 => "[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$memoryActions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/memoryActions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_85d62329._.js.map