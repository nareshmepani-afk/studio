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
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/email.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"60431f5d88231f0dd96dd071bd4953e592b5efdd62":"sendPasswordResetEmail"},"",""] */ __turbopack_context__.s([
    "sendPasswordResetEmail",
    ()=>sendPasswordResetEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/resend/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function sendPasswordResetEmail(email, link) {
    // The RESEND_API_KEY must be set in your environment variables for this to work.
    const resend = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Resend"](process.env.RESEND_API_KEY);
    try {
        await resend.emails.send({
            // This now uses our verified domain to ensure deliverability.
            from: 'noreply@memoryweaver.studio',
            to: email,
            subject: 'Reset Your Memory Weaver Password',
            html: `<p>Click the link to reset your password: <a href="${link}">Reset Password</a></p>`
        });
        console.log(`Password reset email successfully sent to ${email}`);
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        // Re-throw the error to be handled by the calling action
        throw new Error('The email sending service failed.');
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    sendPasswordResetEmail
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendPasswordResetEmail, "60431f5d88231f0dd96dd071bd4953e592b5efdd62", null);
}),
"[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40ae70ceb949f230ee2c0656f962c4630e31932372":"requestPasswordReset"},"",""] */ __turbopack_context__.s([
    "requestPasswordReset",
    ()=>requestPasswordReset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase-admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/email.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function requestPasswordReset(email) {
    try {
        if (!email) {
            return {
                success: false,
                message: 'Email is required.'
            };
        }
        // 1. Generate the password reset link using the Firebase Admin SDK.
        const link = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2d$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"].generatePasswordResetLink(email);
        // 2. Send the email using our Resend service.
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendPasswordResetEmail"])(email, link);
        // For security, we don't want to confirm if an email exists or not.
        return {
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        };
    } catch (error) {
        // Firebase Admin SDK throws an 'auth/user-not-found' error if the user doesn't exist.
        // We will catch this specific error and treat it as a success from the user's perspective
        // to prevent email enumeration attacks.
        if (error.code === 'auth/user-not-found') {
            console.log(`[ACTION] Password reset requested for non-existent user: ${email}`);
            return {
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            };
        }
        // For all other errors, log them and return a generic failure message.
        console.error('[ACTION FAILED] requestPasswordReset:', error);
        return {
            success: false,
            message: 'Could not send password reset link. Please try again later.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    requestPasswordReset
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(requestPasswordReset, "40ae70ceb949f230ee2c0656f962c4630e31932372", null);
}),
"[project]/.next-internal/server/app/login/forgot-password/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$requestPasswordResetAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/.next-internal/server/app/login/forgot-password/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00d38ff2ea3f621d1e67e4caa6ce7f03f8bb16059a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSessionAction"],
    "40283785d06fe4a4ff265b05f767de2bc35f02b5a1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSessionAction"],
    "40ae70ceb949f230ee2c0656f962c4630e31932372",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$requestPasswordResetAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requestPasswordReset"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$login$2f$forgot$2d$password$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$requestPasswordResetAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/login/forgot-password/page/actions.js { ACTIONS_MODULE0 => "[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$createSessionAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/createSessionAction.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$requestPasswordResetAction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/requestPasswordResetAction.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6e214b2b._.js.map