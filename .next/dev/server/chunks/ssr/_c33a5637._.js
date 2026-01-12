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
const serviceAccount = {
    "type": "service_account",
    "project_id": "memory-weaver-8rk9t",
    "private_key_id": "4095e6e99ea524fc036067b2967a484c59f9d8d3",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC/En+kQ81GtemF\nV+6rrFwMUM4FuswwhE/v9bzri4+Xwz29U5UsJwPxDjU2VvNOXVRbumz3Sm18ZJ14\ndr1IlWhsaNyrJM3QCpIi8cf1cPqccrK3lEDM4OKP1WEIBapf34qUyJ8sJ7FKVlZK\niRwK5vIuDgd7Q0c8bsGAq18dBNBFErsmfbg7BPAtjKG2MiwXtsxezOkNcoqX55d6\nZLoxgZTZ+shb09/0s/XpmjsaNDh2PHIKwxKvjUbw0dB03Dc9siZ/mefwcwwpgQGD\ntwdOFpsRYRtqw1e0AyM+iOkQzGchJAlUTrCRFMxisPX3Pd94DUQyU14jHbbgV9OK\nKy+WTyX3AgMBAAECggEAC2NM3Dt2Rpqc+meNQAobylgej1Tcyp94LDMXOWqt+juW\nuGv83g7NO1a/cSephKgnWPg5elujPuC4Se+5xFOzT5LIZCLjaVzX7OFAK666IQzs\n/egGHK/ikPQEvnen+eLW3Zs/cWBEPsv6hKK7WyL8mCYZ6AzQeBeZzNNp7c7Vougq\nfB1+15wYOhuqwimqwrPaFQu2b2aAmfirW8HpS/lnATtZxfNz8SWFRWU2t6WVYEf/\nk1gHrK4gd1legNprIjUS7ObjiMLbZWjOqUox7UV97CorrT67mnOuJgS87EAfTItg\n2ZKLx5yoSHTf5s5mUG/+OZzhZBbg/5Jr4k3vt8b+oQKBgQDpqdeAv+Ca10aORU3N\nQh8hGSnU2UEDeTc+vZySxAQorNQ78QnekJJq6oIophDYnayApQu3R5rQ+Wp0L2xi\nlGn1OU3uIZkqB83gZyocylAaluWwjN+9cjBBkcJEO6vaClU4zg6eTHhzkqVkwOOo\nSGqdLcLMeioqCTUMolsUUteIGQKBgQDRVmAGpYzyOhkwjU8CZgC+e2S3+z4+E7nU\nDlyZWBP4Qn5Odj5pbf9NuM2cbMcoaGYBscTKpZFi3O+xlwoc+gOQLap0yMu3Ycji\nUVHZo+2d3OrYnoznH6iiYgCFC9mqidogjV5DJpCOe4204xi7p0qnb9jcDNEixExd\neCTp/v8gjwKBgQCDRB/Fu4VhV0jSygpAIkI8pNdENNx6KBGqFHkuViID+7urBOlH\neC5ZE+8VCN3z4vgyuQWQ7BAED+oG5VFdPAUedxfZjFRwMTwuMaaNz/YaSeU1Pp6+\n3bRQUaMyE9eiQSXJKLE7qrgMLTjvFhGOy0fhjwCdQJAJV2zO8TJ7g2KDmQKBgQCF\nZuni0nUzl9qdmi+Tc7VdrfzNUgqkPKXbgRt5jSuMtbMQBUJYpYRg3zgISznPglgf\nFE44ZbJ0sh79qScEuD61DqTlr2BDCMmfj/r9Gv49756pVMCuOPqaIKH8J0Ua7KZY\nwD4lxNmyMwJnF6GXVFC6ywgDkxdjdHzFw96iT6H9+QKBgQCIjw5NIaTcIaQrPPNU\ntJQwKEBT6J7G1Ur1DqbWTld8uf2o38oqSQBco9rm9PsAjvU+RBulGDuFn1BZz0L7\nLxFoNuNifzgpnj/pqhW6wTu6Y9Vy9EWkmzV0KeIij7XBXVAEZQfjdqGvX10HQgMA\n5HqM32/wNhME8N1gZDoYVvmrig==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@memory-weaver-8rk9t.iam.gserviceaccount.com",
    "client_id": "105850255169459264510",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40memory-weaver-8rk9t.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length) {
    try {
        __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["initializeApp"]({
            credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["credential"].cert(serviceAccount),
            storageBucket: 'memory-weaver-8rk9t.appspot.com'
        });
        console.log('[firebase-admin] Admin SDK initialized successfully with hardcoded service account.');
    } catch (error) {
        console.error('[firebase-admin] CRITICAL: Firebase Admin initialization failed:', error);
    }
}
if (__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"].length > 0 && __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["apps"][0]) {
    adminDb = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["firestore"]();
    adminAuth = __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$firebase$2d$admin$29$__["auth"]();
} else {
    console.error('[firebase-admin] Admin SDK not initialized. Firebase server-side calls will fail.');
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
"[project]/.next-internal/server/app/_not-found/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/_not-found/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00d38ff2ea3f621d1e67e4caa6ce7f03f8bb16059a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSessionAction"],
    "40283785d06fe4a4ff265b05f767de2bc35f02b5a1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSessionAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$_not$2d$found$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/_not-found/page/actions.js { ACTIONS_MODULE0 => "[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_c33a5637._.js.map