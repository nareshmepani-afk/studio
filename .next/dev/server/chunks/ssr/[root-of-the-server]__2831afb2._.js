module.exports = [
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)"); //# sourceMappingURL=server-reference.js.map
}),
"[project]/node_modules/next/dist/server/web/spec-extension/cookies.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    RequestCookies: null,
    ResponseCookies: null,
    stringifyCookie: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RequestCookies: function() {
        return _cookies.RequestCookies;
    },
    ResponseCookies: function() {
        return _cookies.ResponseCookies;
    },
    stringifyCookie: function() {
        return _cookies.stringifyCookie;
    }
});
const _cookies = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/@edge-runtime/cookies/index.js [app-rsc] (ecmascript)"); //# sourceMappingURL=cookies.js.map
}),
"[project]/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReflectAdapter", {
    enumerable: true,
    get: function() {
        return ReflectAdapter;
    }
});
class ReflectAdapter {
    static get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
            return value.bind(target);
        }
        return value;
    }
    static set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
    static has(target, prop) {
        return Reflect.has(target, prop);
    }
    static deleteProperty(target, prop) {
        return Reflect.deleteProperty(target, prop);
    }
} //# sourceMappingURL=reflect.js.map
}),
"[project]/node_modules/next/dist/shared/lib/action-revalidation-kind.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ActionDidNotRevalidate: null,
    ActionDidRevalidateDynamicOnly: null,
    ActionDidRevalidateStaticAndDynamic: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ActionDidNotRevalidate: function() {
        return ActionDidNotRevalidate;
    },
    ActionDidRevalidateDynamicOnly: function() {
        return ActionDidRevalidateDynamicOnly;
    },
    ActionDidRevalidateStaticAndDynamic: function() {
        return ActionDidRevalidateStaticAndDynamic;
    }
});
const ActionDidNotRevalidate = 0;
const ActionDidRevalidateStaticAndDynamic = 1;
const ActionDidRevalidateDynamicOnly = 2; //# sourceMappingURL=action-revalidation-kind.js.map
}),
"[project]/node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    MutableRequestCookiesAdapter: null,
    ReadonlyRequestCookiesError: null,
    RequestCookiesAdapter: null,
    appendMutableCookies: null,
    areCookiesMutableInCurrentPhase: null,
    createCookiesWithMutableAccessCheck: null,
    getModifiedCookieValues: null,
    responseCookiesToRequestCookies: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    MutableRequestCookiesAdapter: function() {
        return MutableRequestCookiesAdapter;
    },
    ReadonlyRequestCookiesError: function() {
        return ReadonlyRequestCookiesError;
    },
    RequestCookiesAdapter: function() {
        return RequestCookiesAdapter;
    },
    appendMutableCookies: function() {
        return appendMutableCookies;
    },
    areCookiesMutableInCurrentPhase: function() {
        return areCookiesMutableInCurrentPhase;
    },
    createCookiesWithMutableAccessCheck: function() {
        return createCookiesWithMutableAccessCheck;
    },
    getModifiedCookieValues: function() {
        return getModifiedCookieValues;
    },
    responseCookiesToRequestCookies: function() {
        return responseCookiesToRequestCookies;
    }
});
const _cookies = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/cookies.js [app-rsc] (ecmascript)");
const _reflect = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js [app-rsc] (ecmascript)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _actionrevalidationkind = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/action-revalidation-kind.js [app-rsc] (ecmascript)");
class ReadonlyRequestCookiesError extends Error {
    constructor(){
        super('Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options');
    }
    static callable() {
        throw new ReadonlyRequestCookiesError();
    }
}
class RequestCookiesAdapter {
    static seal(cookies) {
        return new Proxy(cookies, {
            get (target, prop, receiver) {
                switch(prop){
                    case 'clear':
                    case 'delete':
                    case 'set':
                        return ReadonlyRequestCookiesError.callable;
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
}
const SYMBOL_MODIFY_COOKIE_VALUES = Symbol.for('next.mutated.cookies');
function getModifiedCookieValues(cookies) {
    const modified = cookies[SYMBOL_MODIFY_COOKIE_VALUES];
    if (!modified || !Array.isArray(modified) || modified.length === 0) {
        return [];
    }
    return modified;
}
function appendMutableCookies(headers, mutableCookies) {
    const modifiedCookieValues = getModifiedCookieValues(mutableCookies);
    if (modifiedCookieValues.length === 0) {
        return false;
    }
    // Return a new response that extends the response with
    // the modified cookies as fallbacks. `res` cookies
    // will still take precedence.
    const resCookies = new _cookies.ResponseCookies(headers);
    const returnedCookies = resCookies.getAll();
    // Set the modified cookies as fallbacks.
    for (const cookie of modifiedCookieValues){
        resCookies.set(cookie);
    }
    // Set the original cookies as the final values.
    for (const cookie of returnedCookies){
        resCookies.set(cookie);
    }
    return true;
}
class MutableRequestCookiesAdapter {
    static wrap(cookies, onUpdateCookies) {
        const responseCookies = new _cookies.ResponseCookies(new Headers());
        for (const cookie of cookies.getAll()){
            responseCookies.set(cookie);
        }
        let modifiedValues = [];
        const modifiedCookies = new Set();
        const updateResponseCookies = ()=>{
            // TODO-APP: change method of getting workStore
            const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
            if (workStore) {
                workStore.pathWasRevalidated = _actionrevalidationkind.ActionDidRevalidateStaticAndDynamic;
            }
            const allCookies = responseCookies.getAll();
            modifiedValues = allCookies.filter((c)=>modifiedCookies.has(c.name));
            if (onUpdateCookies) {
                const serializedCookies = [];
                for (const cookie of modifiedValues){
                    const tempCookies = new _cookies.ResponseCookies(new Headers());
                    tempCookies.set(cookie);
                    serializedCookies.push(tempCookies.toString());
                }
                onUpdateCookies(serializedCookies);
            }
        };
        const wrappedCookies = new Proxy(responseCookies, {
            get (target, prop, receiver) {
                switch(prop){
                    // A special symbol to get the modified cookie values
                    case SYMBOL_MODIFY_COOKIE_VALUES:
                        return modifiedValues;
                    // TODO: Throw error if trying to set a cookie after the response
                    // headers have been set.
                    case 'delete':
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === 'string' ? args[0] : args[0].name);
                            try {
                                target.delete(...args);
                                return wrappedCookies;
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    case 'set':
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === 'string' ? args[0] : args[0].name);
                            try {
                                target.set(...args);
                                return wrappedCookies;
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
        return wrappedCookies;
    }
}
function createCookiesWithMutableAccessCheck(requestStore) {
    const wrappedCookies = new Proxy(requestStore.mutableCookies, {
        get (target, prop, receiver) {
            switch(prop){
                case 'delete':
                    return function(...args) {
                        ensureCookiesAreStillMutable(requestStore, 'cookies().delete');
                        target.delete(...args);
                        return wrappedCookies;
                    };
                case 'set':
                    return function(...args) {
                        ensureCookiesAreStillMutable(requestStore, 'cookies().set');
                        target.set(...args);
                        return wrappedCookies;
                    };
                default:
                    return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
        }
    });
    return wrappedCookies;
}
function areCookiesMutableInCurrentPhase(requestStore) {
    return requestStore.phase === 'action';
}
/** Ensure that cookies() starts throwing on mutation
 * if we changed phases and can no longer mutate.
 *
 * This can happen when going:
 *   'render' -> 'after'
 *   'action' -> 'render'
 * */ function ensureCookiesAreStillMutable(requestStore, _callingExpression) {
    if (!areCookiesMutableInCurrentPhase(requestStore)) {
        // TODO: maybe we can give a more precise error message based on callingExpression?
        throw new ReadonlyRequestCookiesError();
    }
}
function responseCookiesToRequestCookies(responseCookies) {
    const requestCookies = new _cookies.RequestCookies(new Headers());
    for (const cookie of responseCookies.getAll()){
        requestCookies.set(cookie);
    }
    return requestCookies;
} //# sourceMappingURL=request-cookies.js.map
}),
"[project]/node_modules/next/dist/client/components/hooks-server-context.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DynamicServerError: null,
    isDynamicServerError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DynamicServerError: function() {
        return DynamicServerError;
    },
    isDynamicServerError: function() {
        return isDynamicServerError;
    }
});
const DYNAMIC_ERROR_CODE = 'DYNAMIC_SERVER_USAGE';
class DynamicServerError extends Error {
    constructor(description){
        super(`Dynamic server usage: ${description}`), this.description = description, this.digest = DYNAMIC_ERROR_CODE;
    }
}
function isDynamicServerError(err) {
    if (typeof err !== 'object' || err === null || !('digest' in err) || typeof err.digest !== 'string') {
        return false;
    }
    return err.digest === DYNAMIC_ERROR_CODE;
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=hooks-server-context.js.map
}),
"[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    StaticGenBailoutError: null,
    isStaticGenBailoutError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    StaticGenBailoutError: function() {
        return StaticGenBailoutError;
    },
    isStaticGenBailoutError: function() {
        return isStaticGenBailoutError;
    }
});
const NEXT_STATIC_GEN_BAILOUT = 'NEXT_STATIC_GEN_BAILOUT';
class StaticGenBailoutError extends Error {
    constructor(...args){
        super(...args), this.code = NEXT_STATIC_GEN_BAILOUT;
    }
}
function isStaticGenBailoutError(error) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
        return false;
    }
    return error.code === NEXT_STATIC_GEN_BAILOUT;
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=static-generation-bailout.js.map
}),
"[project]/node_modules/next/dist/server/dynamic-rendering-utils.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isHangingPromiseRejectionError: null,
    makeDevtoolsIOAwarePromise: null,
    makeHangingPromise: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    isHangingPromiseRejectionError: function() {
        return isHangingPromiseRejectionError;
    },
    makeDevtoolsIOAwarePromise: function() {
        return makeDevtoolsIOAwarePromise;
    },
    makeHangingPromise: function() {
        return makeHangingPromise;
    }
});
function isHangingPromiseRejectionError(err) {
    if (typeof err !== 'object' || err === null || !('digest' in err)) {
        return false;
    }
    return err.digest === HANGING_PROMISE_REJECTION;
}
const HANGING_PROMISE_REJECTION = 'HANGING_PROMISE_REJECTION';
class HangingPromiseRejectionError extends Error {
    constructor(route, expression){
        super(`During prerendering, ${expression} rejects when the prerender is complete. Typically these errors are handled by React but if you move ${expression} to a different context by using \`setTimeout\`, \`after\`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "${route}".`), this.route = route, this.expression = expression, this.digest = HANGING_PROMISE_REJECTION;
    }
}
const abortListenersBySignal = new WeakMap();
function makeHangingPromise(signal, route, expression) {
    if (signal.aborted) {
        return Promise.reject(new HangingPromiseRejectionError(route, expression));
    } else {
        const hangingPromise = new Promise((_, reject)=>{
            const boundRejection = reject.bind(null, new HangingPromiseRejectionError(route, expression));
            let currentListeners = abortListenersBySignal.get(signal);
            if (currentListeners) {
                currentListeners.push(boundRejection);
            } else {
                const listeners = [
                    boundRejection
                ];
                abortListenersBySignal.set(signal, listeners);
                signal.addEventListener('abort', ()=>{
                    for(let i = 0; i < listeners.length; i++){
                        listeners[i]();
                    }
                }, {
                    once: true
                });
            }
        });
        // We are fine if no one actually awaits this promise. We shouldn't consider this an unhandled rejection so
        // we attach a noop catch handler here to suppress this warning. If you actually await somewhere or construct
        // your own promise out of it you'll need to ensure you handle the error when it rejects.
        hangingPromise.catch(ignoreReject);
        return hangingPromise;
    }
}
function ignoreReject() {}
function makeDevtoolsIOAwarePromise(underlying, requestStore, stage) {
    if (requestStore.stagedRendering) {
        // We resolve each stage in a timeout, so React DevTools will pick this up as IO.
        return requestStore.stagedRendering.delayUntilStage(stage, undefined, underlying);
    }
    // in React DevTools if we resolve in a setTimeout we will observe
    // the promise resolution as something that can suspend a boundary or root.
    return new Promise((resolve)=>{
        // Must use setTimeout to be considered IO React DevTools. setImmediate will not work.
        setTimeout(()=>{
            resolve(underlying);
        }, 0);
    });
} //# sourceMappingURL=dynamic-rendering-utils.js.map
}),
"[project]/node_modules/next/dist/lib/framework/boundary-constants.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    METADATA_BOUNDARY_NAME: null,
    OUTLET_BOUNDARY_NAME: null,
    ROOT_LAYOUT_BOUNDARY_NAME: null,
    VIEWPORT_BOUNDARY_NAME: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    METADATA_BOUNDARY_NAME: function() {
        return METADATA_BOUNDARY_NAME;
    },
    OUTLET_BOUNDARY_NAME: function() {
        return OUTLET_BOUNDARY_NAME;
    },
    ROOT_LAYOUT_BOUNDARY_NAME: function() {
        return ROOT_LAYOUT_BOUNDARY_NAME;
    },
    VIEWPORT_BOUNDARY_NAME: function() {
        return VIEWPORT_BOUNDARY_NAME;
    }
});
const METADATA_BOUNDARY_NAME = '__next_metadata_boundary__';
const VIEWPORT_BOUNDARY_NAME = '__next_viewport_boundary__';
const OUTLET_BOUNDARY_NAME = '__next_outlet_boundary__';
const ROOT_LAYOUT_BOUNDARY_NAME = '__next_root_layout_boundary__'; //# sourceMappingURL=boundary-constants.js.map
}),
"[project]/node_modules/next/dist/lib/scheduler.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    atLeastOneTask: null,
    scheduleImmediate: null,
    scheduleOnNextTick: null,
    waitAtLeastOneReactRenderTask: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    atLeastOneTask: function() {
        return atLeastOneTask;
    },
    scheduleImmediate: function() {
        return scheduleImmediate;
    },
    scheduleOnNextTick: function() {
        return scheduleOnNextTick;
    },
    waitAtLeastOneReactRenderTask: function() {
        return waitAtLeastOneReactRenderTask;
    }
});
const scheduleOnNextTick = (cb)=>{
    // We use Promise.resolve().then() here so that the operation is scheduled at
    // the end of the promise job queue, we then add it to the next process tick
    // to ensure it's evaluated afterwards.
    //
    // This was inspired by the implementation of the DataLoader interface: https://github.com/graphql/dataloader/blob/d336bd15282664e0be4b4a657cb796f09bafbc6b/src/index.js#L213-L255
    //
    Promise.resolve().then(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        else {
            process.nextTick(cb);
        }
    });
};
const scheduleImmediate = (cb)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        setImmediate(cb);
    }
};
function atLeastOneTask() {
    return new Promise((resolve)=>scheduleImmediate(resolve));
}
function waitAtLeastOneReactRenderTask() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        return new Promise((r)=>setImmediate(r));
    }
} //# sourceMappingURL=scheduler.js.map
}),
"[project]/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This has to be a shared module which is shared between client component error boundary and dynamic component
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    BailoutToCSRError: null,
    isBailoutToCSRError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    BailoutToCSRError: function() {
        return BailoutToCSRError;
    },
    isBailoutToCSRError: function() {
        return isBailoutToCSRError;
    }
});
const BAILOUT_TO_CSR = 'BAILOUT_TO_CLIENT_SIDE_RENDERING';
class BailoutToCSRError extends Error {
    constructor(reason){
        super(`Bail out to client-side rendering: ${reason}`), this.reason = reason, this.digest = BAILOUT_TO_CSR;
    }
}
function isBailoutToCSRError(err) {
    if (typeof err !== 'object' || err === null || !('digest' in err)) {
        return false;
    }
    return err.digest === BAILOUT_TO_CSR;
} //# sourceMappingURL=bailout-to-csr.js.map
}),
"[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InvariantError", {
    enumerable: true,
    get: function() {
        return InvariantError;
    }
});
class InvariantError extends Error {
    constructor(message, options){
        super(`Invariant: ${message.endsWith('.') ? message : message + '.'} This is a bug in Next.js.`, options);
        this.name = 'InvariantError';
    }
} //# sourceMappingURL=invariant-error.js.map
}),
"[project]/node_modules/next/dist/server/app-render/dynamic-rendering.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * The functions provided by this module are used to communicate certain properties
 * about the currently running code so that Next.js can make decisions on how to handle
 * the current execution in different rendering modes such as pre-rendering, resuming, and SSR.
 *
 * Today Next.js treats all code as potentially static. Certain APIs may only make sense when dynamically rendering.
 * Traditionally this meant deopting the entire render to dynamic however with PPR we can now deopt parts
 * of a React tree as dynamic while still keeping other parts static. There are really two different kinds of
 * Dynamic indications.
 *
 * The first is simply an intention to be dynamic. unstable_noStore is an example of this where
 * the currently executing code simply declares that the current scope is dynamic but if you use it
 * inside unstable_cache it can still be cached. This type of indication can be removed if we ever
 * make the default dynamic to begin with because the only way you would ever be static is inside
 * a cache scope which this indication does not affect.
 *
 * The second is an indication that a dynamic data source was read. This is a stronger form of dynamic
 * because it means that it is inappropriate to cache this at all. using a dynamic data source inside
 * unstable_cache should error. If you want to use some dynamic data inside unstable_cache you should
 * read that data outside the cache and pass it in as an argument to the cached function.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    Postpone: null,
    PreludeState: null,
    abortAndThrowOnSynchronousRequestDataAccess: null,
    abortOnSynchronousPlatformIOAccess: null,
    accessedDynamicData: null,
    annotateDynamicAccess: null,
    consumeDynamicAccess: null,
    createDynamicTrackingState: null,
    createDynamicValidationState: null,
    createHangingInputAbortSignal: null,
    createRenderInBrowserAbortSignal: null,
    delayUntilRuntimeStage: null,
    formatDynamicAPIAccesses: null,
    getFirstDynamicReason: null,
    getStaticShellDisallowedDynamicReasons: null,
    isDynamicPostpone: null,
    isPrerenderInterruptedError: null,
    logDisallowedDynamicError: null,
    markCurrentScopeAsDynamic: null,
    postponeWithTracking: null,
    throwIfDisallowedDynamic: null,
    throwToInterruptStaticGeneration: null,
    trackAllowedDynamicAccess: null,
    trackDynamicDataInDynamicRender: null,
    trackDynamicHoleInRuntimeShell: null,
    trackDynamicHoleInStaticShell: null,
    useDynamicRouteParams: null,
    useDynamicSearchParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    Postpone: function() {
        return Postpone;
    },
    PreludeState: function() {
        return PreludeState;
    },
    abortAndThrowOnSynchronousRequestDataAccess: function() {
        return abortAndThrowOnSynchronousRequestDataAccess;
    },
    abortOnSynchronousPlatformIOAccess: function() {
        return abortOnSynchronousPlatformIOAccess;
    },
    accessedDynamicData: function() {
        return accessedDynamicData;
    },
    annotateDynamicAccess: function() {
        return annotateDynamicAccess;
    },
    consumeDynamicAccess: function() {
        return consumeDynamicAccess;
    },
    createDynamicTrackingState: function() {
        return createDynamicTrackingState;
    },
    createDynamicValidationState: function() {
        return createDynamicValidationState;
    },
    createHangingInputAbortSignal: function() {
        return createHangingInputAbortSignal;
    },
    createRenderInBrowserAbortSignal: function() {
        return createRenderInBrowserAbortSignal;
    },
    delayUntilRuntimeStage: function() {
        return delayUntilRuntimeStage;
    },
    formatDynamicAPIAccesses: function() {
        return formatDynamicAPIAccesses;
    },
    getFirstDynamicReason: function() {
        return getFirstDynamicReason;
    },
    getStaticShellDisallowedDynamicReasons: function() {
        return getStaticShellDisallowedDynamicReasons;
    },
    isDynamicPostpone: function() {
        return isDynamicPostpone;
    },
    isPrerenderInterruptedError: function() {
        return isPrerenderInterruptedError;
    },
    logDisallowedDynamicError: function() {
        return logDisallowedDynamicError;
    },
    markCurrentScopeAsDynamic: function() {
        return markCurrentScopeAsDynamic;
    },
    postponeWithTracking: function() {
        return postponeWithTracking;
    },
    throwIfDisallowedDynamic: function() {
        return throwIfDisallowedDynamic;
    },
    throwToInterruptStaticGeneration: function() {
        return throwToInterruptStaticGeneration;
    },
    trackAllowedDynamicAccess: function() {
        return trackAllowedDynamicAccess;
    },
    trackDynamicDataInDynamicRender: function() {
        return trackDynamicDataInDynamicRender;
    },
    trackDynamicHoleInRuntimeShell: function() {
        return trackDynamicHoleInRuntimeShell;
    },
    trackDynamicHoleInStaticShell: function() {
        return trackDynamicHoleInStaticShell;
    },
    useDynamicRouteParams: function() {
        return useDynamicRouteParams;
    },
    useDynamicSearchParams: function() {
        return useDynamicSearchParams;
    }
});
const _react = /*#__PURE__*/ _interop_require_default(__turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)"));
const _hooksservercontext = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/hooks-server-context.js [app-rsc] (ecmascript)");
const _staticgenerationbailout = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)");
const _workunitasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _dynamicrenderingutils = __turbopack_context__.r("[project]/node_modules/next/dist/server/dynamic-rendering-utils.js [app-rsc] (ecmascript)");
const _boundaryconstants = __turbopack_context__.r("[project]/node_modules/next/dist/lib/framework/boundary-constants.js [app-rsc] (ecmascript)");
const _scheduler = __turbopack_context__.r("[project]/node_modules/next/dist/lib/scheduler.js [app-rsc] (ecmascript)");
const _bailouttocsr = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js [app-rsc] (ecmascript)");
const _invarianterror = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const hasPostpone = typeof _react.default.unstable_postpone === 'function';
function createDynamicTrackingState(isDebugDynamicAccesses) {
    return {
        isDebugDynamicAccesses,
        dynamicAccesses: [],
        syncDynamicErrorWithStack: null
    };
}
function createDynamicValidationState() {
    return {
        hasSuspenseAboveBody: false,
        hasDynamicMetadata: false,
        dynamicMetadata: null,
        hasDynamicViewport: false,
        hasAllowedDynamic: false,
        dynamicErrors: []
    };
}
function getFirstDynamicReason(trackingState) {
    var _trackingState_dynamicAccesses_;
    return (_trackingState_dynamicAccesses_ = trackingState.dynamicAccesses[0]) == null ? void 0 : _trackingState_dynamicAccesses_.expression;
}
function markCurrentScopeAsDynamic(store, workUnitStore, expression) {
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'cache':
            case 'unstable-cache':
                // Inside cache scopes, marking a scope as dynamic has no effect,
                // because the outer cache scope creates a cache boundary. This is
                // subtly different from reading a dynamic data source, which is
                // forbidden inside a cache scope.
                return;
            case 'private-cache':
                // A private cache scope is already dynamic by definition.
                return;
            case 'prerender-legacy':
            case 'prerender-ppr':
            case 'request':
                break;
            default:
                workUnitStore;
        }
    }
    // If we're forcing dynamic rendering or we're forcing static rendering, we
    // don't need to do anything here because the entire page is already dynamic
    // or it's static and it should not throw or postpone here.
    if (store.forceDynamic || store.forceStatic) return;
    if (store.dynamicShouldError) {
        throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${store.route} with \`dynamic = "error"\` couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
            value: "E553",
            enumerable: false,
            configurable: true
        });
    }
    if (workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender-ppr':
                return postponeWithTracking(store.route, expression, workUnitStore.dynamicTracking);
            case 'prerender-legacy':
                workUnitStore.revalidate = 0;
                // We aren't prerendering, but we are generating a static page. We need
                // to bail out of static generation.
                const err = Object.defineProperty(new _hooksservercontext.DynamicServerError(`Route ${store.route} couldn't be rendered statically because it used ${expression}. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`), "__NEXT_ERROR_CODE", {
                    value: "E550",
                    enumerable: false,
                    configurable: true
                });
                store.dynamicUsageDescription = expression;
                store.dynamicUsageStack = err.stack;
                throw err;
            case 'request':
                if ("TURBOPACK compile-time truthy", 1) {
                    workUnitStore.usedDynamic = true;
                }
                break;
            default:
                workUnitStore;
        }
    }
}
function throwToInterruptStaticGeneration(expression, store, prerenderStore) {
    // We aren't prerendering but we are generating a static page. We need to bail out of static generation
    const err = Object.defineProperty(new _hooksservercontext.DynamicServerError(`Route ${store.route} couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`), "__NEXT_ERROR_CODE", {
        value: "E558",
        enumerable: false,
        configurable: true
    });
    prerenderStore.revalidate = 0;
    store.dynamicUsageDescription = expression;
    store.dynamicUsageStack = err.stack;
    throw err;
}
function trackDynamicDataInDynamicRender(workUnitStore) {
    switch(workUnitStore.type){
        case 'cache':
        case 'unstable-cache':
            // Inside cache scopes, marking a scope as dynamic has no effect,
            // because the outer cache scope creates a cache boundary. This is
            // subtly different from reading a dynamic data source, which is
            // forbidden inside a cache scope.
            return;
        case 'private-cache':
            // A private cache scope is already dynamic by definition.
            return;
        case 'prerender':
        case 'prerender-runtime':
        case 'prerender-legacy':
        case 'prerender-ppr':
        case 'prerender-client':
            break;
        case 'request':
            if ("TURBOPACK compile-time truthy", 1) {
                workUnitStore.usedDynamic = true;
            }
            break;
        default:
            workUnitStore;
    }
}
function abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore) {
    const reason = `Route ${route} needs to bail out of prerendering at this point because it used ${expression}.`;
    const error = createPrerenderInterruptedError(reason);
    prerenderStore.controller.abort(error);
    const dynamicTracking = prerenderStore.dynamicTracking;
    if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
            // When we aren't debugging, we don't need to create another error for the
            // stack trace.
            stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : undefined,
            expression
        });
    }
}
function abortOnSynchronousPlatformIOAccess(route, expression, errorWithStack, prerenderStore) {
    const dynamicTracking = prerenderStore.dynamicTracking;
    abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore);
    // It is important that we set this tracking value after aborting. Aborts are executed
    // synchronously except for the case where you abort during render itself. By setting this
    // value late we can use it to determine if any of the aborted tasks are the task that
    // called the sync IO expression in the first place.
    if (dynamicTracking) {
        if (dynamicTracking.syncDynamicErrorWithStack === null) {
            dynamicTracking.syncDynamicErrorWithStack = errorWithStack;
        }
    }
}
function abortAndThrowOnSynchronousRequestDataAccess(route, expression, errorWithStack, prerenderStore) {
    const prerenderSignal = prerenderStore.controller.signal;
    if (prerenderSignal.aborted === false) {
        // TODO it would be better to move this aborted check into the callsite so we can avoid making
        // the error object when it isn't relevant to the aborting of the prerender however
        // since we need the throw semantics regardless of whether we abort it is easier to land
        // this way. See how this was handled with `abortOnSynchronousPlatformIOAccess` for a closer
        // to ideal implementation
        abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore);
        // It is important that we set this tracking value after aborting. Aborts are executed
        // synchronously except for the case where you abort during render itself. By setting this
        // value late we can use it to determine if any of the aborted tasks are the task that
        // called the sync IO expression in the first place.
        const dynamicTracking = prerenderStore.dynamicTracking;
        if (dynamicTracking) {
            if (dynamicTracking.syncDynamicErrorWithStack === null) {
                dynamicTracking.syncDynamicErrorWithStack = errorWithStack;
            }
        }
    }
    throw createPrerenderInterruptedError(`Route ${route} needs to bail out of prerendering at this point because it used ${expression}.`);
}
function Postpone({ reason, route }) {
    const prerenderStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    const dynamicTracking = prerenderStore && prerenderStore.type === 'prerender-ppr' ? prerenderStore.dynamicTracking : null;
    postponeWithTracking(route, reason, dynamicTracking);
}
function postponeWithTracking(route, expression, dynamicTracking) {
    assertPostpone();
    if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
            // When we aren't debugging, we don't need to create another error for the
            // stack trace.
            stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : undefined,
            expression
        });
    }
    _react.default.unstable_postpone(createPostponeReason(route, expression));
}
function createPostponeReason(route, expression) {
    return `Route ${route} needs to bail out of prerendering at this point because it used ${expression}. ` + `React throws this special object to indicate where. It should not be caught by ` + `your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error`;
}
function isDynamicPostpone(err) {
    if (typeof err === 'object' && err !== null && typeof err.message === 'string') {
        return isDynamicPostponeReason(err.message);
    }
    return false;
}
function isDynamicPostponeReason(reason) {
    return reason.includes('needs to bail out of prerendering at this point because it used') && reason.includes('Learn more: https://nextjs.org/docs/messages/ppr-caught-error');
}
if (isDynamicPostponeReason(createPostponeReason('%%%', '^^^')) === false) {
    throw Object.defineProperty(new Error('Invariant: isDynamicPostpone misidentified a postpone reason. This is a bug in Next.js'), "__NEXT_ERROR_CODE", {
        value: "E296",
        enumerable: false,
        configurable: true
    });
}
const NEXT_PRERENDER_INTERRUPTED = 'NEXT_PRERENDER_INTERRUPTED';
function createPrerenderInterruptedError(message) {
    const error = Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
    });
    error.digest = NEXT_PRERENDER_INTERRUPTED;
    return error;
}
function isPrerenderInterruptedError(error) {
    return typeof error === 'object' && error !== null && error.digest === NEXT_PRERENDER_INTERRUPTED && 'name' in error && 'message' in error && error instanceof Error;
}
function accessedDynamicData(dynamicAccesses) {
    return dynamicAccesses.length > 0;
}
function consumeDynamicAccess(serverDynamic, clientDynamic) {
    // We mutate because we only call this once we are no longer writing
    // to the dynamicTrackingState and it's more efficient than creating a new
    // array.
    serverDynamic.dynamicAccesses.push(...clientDynamic.dynamicAccesses);
    return serverDynamic.dynamicAccesses;
}
function formatDynamicAPIAccesses(dynamicAccesses) {
    return dynamicAccesses.filter((access)=>typeof access.stack === 'string' && access.stack.length > 0).map(({ expression, stack })=>{
        stack = stack.split('\n') // Remove the "Error: " prefix from the first line of the stack trace as
        // well as the first 4 lines of the stack trace which is the distance
        // from the user code and the `new Error().stack` call.
        .slice(4).filter((line)=>{
            // Exclude Next.js internals from the stack trace.
            if (line.includes('node_modules/next/')) {
                return false;
            }
            // Exclude anonymous functions from the stack trace.
            if (line.includes(' (<anonymous>)')) {
                return false;
            }
            // Exclude Node.js internals from the stack trace.
            if (line.includes(' (node:')) {
                return false;
            }
            return true;
        }).join('\n');
        return `Dynamic API Usage Debug - ${expression}:\n${stack}`;
    });
}
function assertPostpone() {
    if (!hasPostpone) {
        throw Object.defineProperty(new Error(`Invariant: React.unstable_postpone is not defined. This suggests the wrong version of React was loaded. This is a bug in Next.js`), "__NEXT_ERROR_CODE", {
            value: "E224",
            enumerable: false,
            configurable: true
        });
    }
}
function createRenderInBrowserAbortSignal() {
    const controller = new AbortController();
    controller.abort(Object.defineProperty(new _bailouttocsr.BailoutToCSRError('Render in Browser'), "__NEXT_ERROR_CODE", {
        value: "E721",
        enumerable: false,
        configurable: true
    }));
    return controller.signal;
}
function createHangingInputAbortSignal(workUnitStore) {
    switch(workUnitStore.type){
        case 'prerender':
        case 'prerender-runtime':
            const controller = new AbortController();
            if (workUnitStore.cacheSignal) {
                // If we have a cacheSignal it means we're in a prospective render. If
                // the input we're waiting on is coming from another cache, we do want
                // to wait for it so that we can resolve this cache entry too.
                workUnitStore.cacheSignal.inputReady().then(()=>{
                    controller.abort();
                });
            } else {
                // Otherwise we're in the final render and we should already have all
                // our caches filled.
                // If the prerender uses stages, we have wait until the runtime stage,
                // at which point all runtime inputs will be resolved.
                // (otherwise, a runtime prerender might consider `cookies()` hanging
                //  even though they'd resolve in the next task.)
                //
                // We might still be waiting on some microtasks so we
                // wait one tick before giving up. When we give up, we still want to
                // render the content of this cache as deeply as we can so that we can
                // suspend as deeply as possible in the tree or not at all if we don't
                // end up waiting for the input.
                const runtimeStagePromise = (0, _workunitasyncstorageexternal.getRuntimeStagePromise)(workUnitStore);
                if (runtimeStagePromise) {
                    runtimeStagePromise.then(()=>(0, _scheduler.scheduleOnNextTick)(()=>controller.abort()));
                } else {
                    (0, _scheduler.scheduleOnNextTick)(()=>controller.abort());
                }
            }
            return controller.signal;
        case 'prerender-client':
        case 'prerender-ppr':
        case 'prerender-legacy':
        case 'request':
        case 'cache':
        case 'private-cache':
        case 'unstable-cache':
            return undefined;
        default:
            workUnitStore;
    }
}
function annotateDynamicAccess(expression, prerenderStore) {
    const dynamicTracking = prerenderStore.dynamicTracking;
    if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
            stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : undefined,
            expression
        });
    }
}
function useDynamicRouteParams(expression) {
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (workStore && workUnitStore) {
        switch(workUnitStore.type){
            case 'prerender-client':
            case 'prerender':
                {
                    const fallbackParams = workUnitStore.fallbackRouteParams;
                    if (fallbackParams && fallbackParams.size > 0) {
                        // We are in a prerender with cacheComponents semantics. We are going to
                        // hang here and never resolve. This will cause the currently
                        // rendering component to effectively be a dynamic hole.
                        _react.default.use((0, _dynamicrenderingutils.makeHangingPromise)(workUnitStore.renderSignal, workStore.route, expression));
                    }
                    break;
                }
            case 'prerender-ppr':
                {
                    const fallbackParams = workUnitStore.fallbackRouteParams;
                    if (fallbackParams && fallbackParams.size > 0) {
                        return postponeWithTracking(workStore.route, expression, workUnitStore.dynamicTracking);
                    }
                    break;
                }
            case 'prerender-runtime':
                throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called during a runtime prerender. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                    value: "E771",
                    enumerable: false,
                    configurable: true
                });
            case 'cache':
            case 'private-cache':
                throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called inside a cache scope. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                    value: "E745",
                    enumerable: false,
                    configurable: true
                });
            case 'prerender-legacy':
            case 'request':
            case 'unstable-cache':
                break;
            default:
                workUnitStore;
        }
    }
}
function useDynamicSearchParams(expression) {
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (!workStore) {
        // We assume pages router context and just return
        return;
    }
    if (!workUnitStore) {
        (0, _workunitasyncstorageexternal.throwForMissingRequestStore)(expression);
    }
    switch(workUnitStore.type){
        case 'prerender-client':
            {
                _react.default.use((0, _dynamicrenderingutils.makeHangingPromise)(workUnitStore.renderSignal, workStore.route, expression));
                break;
            }
        case 'prerender-legacy':
        case 'prerender-ppr':
            {
                if (workStore.forceStatic) {
                    return;
                }
                throw Object.defineProperty(new _bailouttocsr.BailoutToCSRError(expression), "__NEXT_ERROR_CODE", {
                    value: "E394",
                    enumerable: false,
                    configurable: true
                });
            }
        case 'prerender':
        case 'prerender-runtime':
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called from a Server Component. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                value: "E795",
                enumerable: false,
                configurable: true
            });
        case 'cache':
        case 'unstable-cache':
        case 'private-cache':
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called inside a cache scope. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                value: "E745",
                enumerable: false,
                configurable: true
            });
        case 'request':
            return;
        default:
            workUnitStore;
    }
}
const hasSuspenseRegex = /\n\s+at Suspense \(<anonymous>\)/;
// Common implicit body tags that React will treat as body when placed directly in html
const bodyAndImplicitTags = 'body|div|main|section|article|aside|header|footer|nav|form|p|span|h1|h2|h3|h4|h5|h6';
// Detects when RootLayoutBoundary (our framework marker component) appears
// after Suspense in the component stack, indicating the root layout is wrapped
// within a Suspense boundary. Ensures no body/html/implicit-body components are in between.
//
// Example matches:
//   at Suspense (<anonymous>)
//   at __next_root_layout_boundary__ (<anonymous>)
//
// Or with other components in between (but not body/html/implicit-body):
//   at Suspense (<anonymous>)
//   at SomeComponent (<anonymous>)
//   at __next_root_layout_boundary__ (<anonymous>)
const hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex = new RegExp(`\\n\\s+at Suspense \\(<anonymous>\\)(?:(?!\\n\\s+at (?:${bodyAndImplicitTags}) \\(<anonymous>\\))[\\s\\S])*?\\n\\s+at ${_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME} \\([^\\n]*\\)`);
const hasMetadataRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.METADATA_BOUNDARY_NAME}[\\n\\s]`);
const hasViewportRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.VIEWPORT_BOUNDARY_NAME}[\\n\\s]`);
const hasOutletRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.OUTLET_BOUNDARY_NAME}[\\n\\s]`);
function trackAllowedDynamicAccess(workStore, componentStack, dynamicValidation, clientDynamic) {
    if (hasOutletRegex.test(componentStack)) {
        // We don't need to track that this is dynamic. It is only so when something else is also dynamic.
        return;
    } else if (hasMetadataRegex.test(componentStack)) {
        dynamicValidation.hasDynamicMetadata = true;
        return;
    } else if (hasViewportRegex.test(componentStack)) {
        dynamicValidation.hasDynamicViewport = true;
        return;
    } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        // For Suspense within body, the prelude wouldn't be empty so it wouldn't violate the empty static shells rule.
        // But if you have Suspense above body, the prelude is empty but we allow that because having Suspense
        // is an explicit signal from the user that they acknowledge the empty shell and want dynamic rendering.
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
    } else if (hasSuspenseRegex.test(componentStack)) {
        // this error had a Suspense boundary above it so we don't need to report it as a source
        // of disallowed
        dynamicValidation.hasAllowedDynamic = true;
        return;
    } else if (clientDynamic.syncDynamicErrorWithStack) {
        // This task was the task that called the sync error.
        dynamicValidation.dynamicErrors.push(clientDynamic.syncDynamicErrorWithStack);
        return;
    } else {
        const message = `Route "${workStore.route}": Uncached data was accessed outside of ` + '<Suspense>. This delays the entire page from rendering, resulting in a ' + 'slow user experience. Learn more: ' + 'https://nextjs.org/docs/messages/blocking-route';
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicErrors.push(error);
        return;
    }
}
function trackDynamicHoleInRuntimeShell(workStore, componentStack, dynamicValidation, clientDynamic) {
    if (hasOutletRegex.test(componentStack)) {
        // We don't need to track that this is dynamic. It is only so when something else is also dynamic.
        return;
    } else if (hasMetadataRegex.test(componentStack)) {
        const message = `Route "${workStore.route}": Uncached data or \`connection()\` was accessed inside \`generateMetadata\`. Except for this instance, the page would have been entirely prerenderable which may have been the intended behavior. See more info here: https://nextjs.org/docs/messages/next-prerender-dynamic-metadata`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicMetadata = error;
        return;
    } else if (hasViewportRegex.test(componentStack)) {
        const message = `Route "${workStore.route}": Uncached data or \`connection()\` was accessed inside \`generateViewport\`. This delays the entire page from rendering, resulting in a slow user experience. Learn more: https://nextjs.org/docs/messages/next-prerender-dynamic-viewport`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicErrors.push(error);
        return;
    } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        // For Suspense within body, the prelude wouldn't be empty so it wouldn't violate the empty static shells rule.
        // But if you have Suspense above body, the prelude is empty but we allow that because having Suspense
        // is an explicit signal from the user that they acknowledge the empty shell and want dynamic rendering.
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
    } else if (hasSuspenseRegex.test(componentStack)) {
        // this error had a Suspense boundary above it so we don't need to report it as a source
        // of disallowed
        dynamicValidation.hasAllowedDynamic = true;
        return;
    } else if (clientDynamic.syncDynamicErrorWithStack) {
        // This task was the task that called the sync error.
        dynamicValidation.dynamicErrors.push(clientDynamic.syncDynamicErrorWithStack);
        return;
    } else {
        const message = `Route "${workStore.route}": Uncached data or \`connection()\` was accessed outside of \`<Suspense>\`. This delays the entire page from rendering, resulting in a slow user experience. Learn more: https://nextjs.org/docs/messages/blocking-route`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicErrors.push(error);
        return;
    }
}
function trackDynamicHoleInStaticShell(workStore, componentStack, dynamicValidation, clientDynamic) {
    if (hasOutletRegex.test(componentStack)) {
        // We don't need to track that this is dynamic. It is only so when something else is also dynamic.
        return;
    } else if (hasMetadataRegex.test(componentStack)) {
        const message = `Route "${workStore.route}": Runtime data such as \`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` was accessed inside \`generateMetadata\` or you have file-based metadata such as icons that depend on dynamic params segments. Except for this instance, the page would have been entirely prerenderable which may have been the intended behavior. See more info here: https://nextjs.org/docs/messages/next-prerender-dynamic-metadata`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicMetadata = error;
        return;
    } else if (hasViewportRegex.test(componentStack)) {
        const message = `Route "${workStore.route}": Runtime data such as \`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` was accessed inside \`generateViewport\`. This delays the entire page from rendering, resulting in a slow user experience. Learn more: https://nextjs.org/docs/messages/next-prerender-dynamic-viewport`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicErrors.push(error);
        return;
    } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        // For Suspense within body, the prelude wouldn't be empty so it wouldn't violate the empty static shells rule.
        // But if you have Suspense above body, the prelude is empty but we allow that because having Suspense
        // is an explicit signal from the user that they acknowledge the empty shell and want dynamic rendering.
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
    } else if (hasSuspenseRegex.test(componentStack)) {
        // this error had a Suspense boundary above it so we don't need to report it as a source
        // of disallowed
        dynamicValidation.hasAllowedDynamic = true;
        return;
    } else if (clientDynamic.syncDynamicErrorWithStack) {
        // This task was the task that called the sync error.
        dynamicValidation.dynamicErrors.push(clientDynamic.syncDynamicErrorWithStack);
        return;
    } else {
        const message = `Route "${workStore.route}": Runtime data such as \`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` was accessed outside of \`<Suspense>\`. This delays the entire page from rendering, resulting in a slow user experience. Learn more: https://nextjs.org/docs/messages/blocking-route`;
        const error = createErrorWithComponentOrOwnerStack(message, componentStack);
        dynamicValidation.dynamicErrors.push(error);
        return;
    }
}
/**
 * In dev mode, we prefer using the owner stack, otherwise the provided
 * component stack is used.
 */ function createErrorWithComponentOrOwnerStack(message, componentStack) {
    const ownerStack = ("TURBOPACK compile-time value", "development") !== 'production' && _react.default.captureOwnerStack ? _react.default.captureOwnerStack() : null;
    const error = Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
    });
    // TODO go back to owner stack here if available. This is temporarily using componentStack to get the right
    //
    error.stack = error.name + ': ' + message + (ownerStack || componentStack);
    return error;
}
var PreludeState = /*#__PURE__*/ function(PreludeState) {
    PreludeState[PreludeState["Full"] = 0] = "Full";
    PreludeState[PreludeState["Empty"] = 1] = "Empty";
    PreludeState[PreludeState["Errored"] = 2] = "Errored";
    return PreludeState;
}({});
function logDisallowedDynamicError(workStore, error) {
    console.error(error);
    if (!workStore.dev) {
        if (workStore.hasReadableErrorStacks) {
            console.error(`To get a more detailed stack trace and pinpoint the issue, start the app in development mode by running \`next dev\`, then open "${workStore.route}" in your browser to investigate the error.`);
        } else {
            console.error(`To get a more detailed stack trace and pinpoint the issue, try one of the following:
  - Start the app in development mode by running \`next dev\`, then open "${workStore.route}" in your browser to investigate the error.
  - Rerun the production build with \`next build --debug-prerender\` to generate better stack traces.`);
        }
    }
}
function throwIfDisallowedDynamic(workStore, prelude, dynamicValidation, serverDynamic) {
    if (serverDynamic.syncDynamicErrorWithStack) {
        logDisallowedDynamicError(workStore, serverDynamic.syncDynamicErrorWithStack);
        throw new _staticgenerationbailout.StaticGenBailoutError();
    }
    if (prelude !== 0) {
        if (dynamicValidation.hasSuspenseAboveBody) {
            // This route has opted into allowing fully dynamic rendering
            // by including a Suspense boundary above the body. In this case
            // a lack of a shell is not considered disallowed so we simply return
            return;
        }
        // We didn't have any sync bailouts but there may be user code which
        // blocked the root. We would have captured these during the prerender
        // and can log them here and then terminate the build/validating render
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
            for(let i = 0; i < dynamicErrors.length; i++){
                logDisallowedDynamicError(workStore, dynamicErrors[i]);
            }
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
        // If we got this far then the only other thing that could be blocking
        // the root is dynamic Viewport. If this is dynamic then
        // you need to opt into that by adding a Suspense boundary above the body
        // to indicate your are ok with fully dynamic rendering.
        if (dynamicValidation.hasDynamicViewport) {
            console.error(`Route "${workStore.route}" has a \`generateViewport\` that depends on Request data (\`cookies()\`, etc...) or uncached external data (\`fetch(...)\`, etc...) without explicitly allowing fully dynamic rendering. See more info here: https://nextjs.org/docs/messages/next-prerender-dynamic-viewport`);
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
        if (prelude === 1) {
            // If we ever get this far then we messed up the tracking of invalid dynamic.
            // We still adhere to the constraint that you must produce a shell but invite the
            // user to report this as a bug in Next.js.
            console.error(`Route "${workStore.route}" did not produce a static shell and Next.js was unable to determine a reason. This is a bug in Next.js.`);
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
    } else {
        if (dynamicValidation.hasAllowedDynamic === false && dynamicValidation.hasDynamicMetadata) {
            console.error(`Route "${workStore.route}" has a \`generateMetadata\` that depends on Request data (\`cookies()\`, etc...) or uncached external data (\`fetch(...)\`, etc...) when the rest of the route does not. See more info here: https://nextjs.org/docs/messages/next-prerender-dynamic-metadata`);
            throw new _staticgenerationbailout.StaticGenBailoutError();
        }
    }
}
function getStaticShellDisallowedDynamicReasons(workStore, prelude, dynamicValidation) {
    if (dynamicValidation.hasSuspenseAboveBody) {
        // This route has opted into allowing fully dynamic rendering
        // by including a Suspense boundary above the body. In this case
        // a lack of a shell is not considered disallowed so we simply return
        return [];
    }
    if (prelude !== 0) {
        // We didn't have any sync bailouts but there may be user code which
        // blocked the root. We would have captured these during the prerender
        // and can log them here and then terminate the build/validating render
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
            return dynamicErrors;
        }
        if (prelude === 1) {
            // If we ever get this far then we messed up the tracking of invalid dynamic.
            // We still adhere to the constraint that you must produce a shell but invite the
            // user to report this as a bug in Next.js.
            return [
                Object.defineProperty(new _invarianterror.InvariantError(`Route "${workStore.route}" did not produce a static shell and Next.js was unable to determine a reason.`), "__NEXT_ERROR_CODE", {
                    value: "E936",
                    enumerable: false,
                    configurable: true
                })
            ];
        }
    } else {
        // We have a prelude but we might still have dynamic metadata without any other dynamic access
        if (dynamicValidation.hasAllowedDynamic === false && dynamicValidation.dynamicErrors.length === 0 && dynamicValidation.dynamicMetadata) {
            return [
                dynamicValidation.dynamicMetadata
            ];
        }
    }
    // We had a non-empty prelude and there are no dynamic holes
    return [];
}
function delayUntilRuntimeStage(prerenderStore, result) {
    if (prerenderStore.runtimeStagePromise) {
        return prerenderStore.runtimeStagePromise.then(()=>result);
    }
    return result;
} //# sourceMappingURL=dynamic-rendering.js.map
}),
"[project]/node_modules/next/dist/server/create-deduped-by-callsite-server-error-logger.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createDedupedByCallsiteServerErrorLoggerDev", {
    enumerable: true,
    get: function() {
        return createDedupedByCallsiteServerErrorLoggerDev;
    }
});
const _react = /*#__PURE__*/ _interop_require_wildcard(__turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const errorRef = {
    current: null
};
// React.cache is currently only available in canary/experimental React channels.
const cache = typeof _react.cache === 'function' ? _react.cache : (fn)=>fn;
// When Cache Components is enabled, we record these as errors so that they
// are captured by the dev overlay as it's more critical to fix these
// when enabled.
const logErrorOrWarn = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : console.warn;
// We don't want to dedupe across requests.
// The developer might've just attempted to fix the warning so we should warn again if it still happens.
const flushCurrentErrorIfNew = cache((key)=>{
    try {
        logErrorOrWarn(errorRef.current);
    } finally{
        errorRef.current = null;
    }
});
function createDedupedByCallsiteServerErrorLoggerDev(getMessage) {
    return function logDedupedError(...args) {
        const message = getMessage(...args);
        if ("TURBOPACK compile-time truthy", 1) {
            var _stack;
            const callStackFrames = (_stack = new Error().stack) == null ? void 0 : _stack.split('\n');
            if (callStackFrames === undefined || callStackFrames.length < 4) {
                logErrorOrWarn(message);
            } else {
                // Error:
                //   logDedupedError
                //   asyncApiBeingAccessedSynchronously
                //   <userland callsite>
                // TODO: This breaks if sourcemaps with ignore lists are enabled.
                const key = callStackFrames[4];
                errorRef.current = message;
                flushCurrentErrorIfNew(key);
            }
        } else //TURBOPACK unreachable
        ;
    };
} //# sourceMappingURL=create-deduped-by-callsite-server-error-logger.js.map
}),
"[project]/node_modules/next/dist/server/request/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    isRequestAPICallableInsideAfter: null,
    throwForSearchParamsAccessInUseCache: null,
    throwWithStaticGenerationBailoutErrorWithDynamicError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    isRequestAPICallableInsideAfter: function() {
        return isRequestAPICallableInsideAfter;
    },
    throwForSearchParamsAccessInUseCache: function() {
        return throwForSearchParamsAccessInUseCache;
    },
    throwWithStaticGenerationBailoutErrorWithDynamicError: function() {
        return throwWithStaticGenerationBailoutErrorWithDynamicError;
    }
});
const _staticgenerationbailout = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)");
const _aftertaskasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)");
function throwWithStaticGenerationBailoutErrorWithDynamicError(route, expression) {
    throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${route} with \`dynamic = "error"\` couldn't be rendered statically because it used ${expression}. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
        value: "E543",
        enumerable: false,
        configurable: true
    });
}
function throwForSearchParamsAccessInUseCache(workStore, constructorOpt) {
    const error = Object.defineProperty(new Error(`Route ${workStore.route} used \`searchParams\` inside "use cache". Accessing dynamic request data inside a cache scope is not supported. If you need some search params inside a cached function await \`searchParams\` outside of the cached function and pass only the required search params as arguments to the cached function. See more info here: https://nextjs.org/docs/messages/next-request-in-use-cache`), "__NEXT_ERROR_CODE", {
        value: "E842",
        enumerable: false,
        configurable: true
    });
    Error.captureStackTrace(error, constructorOpt);
    workStore.invalidDynamicUsageError ??= error;
    throw error;
}
function isRequestAPICallableInsideAfter() {
    const afterTaskStore = _aftertaskasyncstorageexternal.afterTaskAsyncStorage.getStore();
    return (afterTaskStore == null ? void 0 : afterTaskStore.rootTaskSpawnPhase) === 'action';
} //# sourceMappingURL=utils.js.map
}),
"[project]/node_modules/next/dist/shared/lib/promise-with-resolvers.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createPromiseWithResolvers", {
    enumerable: true,
    get: function() {
        return createPromiseWithResolvers;
    }
});
function createPromiseWithResolvers() {
    // Shim of Stage 4 Promise.withResolvers proposal
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        resolve = res;
        reject = rej;
    });
    return {
        resolve: resolve,
        reject: reject,
        promise
    };
} //# sourceMappingURL=promise-with-resolvers.js.map
}),
"[project]/node_modules/next/dist/server/app-render/staged-rendering.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    RenderStage: null,
    StagedRenderingController: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RenderStage: function() {
        return RenderStage;
    },
    StagedRenderingController: function() {
        return StagedRenderingController;
    }
});
const _invarianterror = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
const _promisewithresolvers = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/promise-with-resolvers.js [app-rsc] (ecmascript)");
var RenderStage = /*#__PURE__*/ function(RenderStage) {
    RenderStage[RenderStage["Before"] = 1] = "Before";
    RenderStage[RenderStage["Static"] = 2] = "Static";
    RenderStage[RenderStage["Runtime"] = 3] = "Runtime";
    RenderStage[RenderStage["Dynamic"] = 4] = "Dynamic";
    RenderStage[RenderStage["Abandoned"] = 5] = "Abandoned";
    return RenderStage;
}({});
class StagedRenderingController {
    constructor(abortSignal = null, hasRuntimePrefetch){
        this.abortSignal = abortSignal;
        this.hasRuntimePrefetch = hasRuntimePrefetch;
        this.currentStage = 1;
        this.staticInterruptReason = null;
        this.runtimeInterruptReason = null;
        this.staticStageEndTime = Infinity;
        this.runtimeStageEndTime = Infinity;
        this.runtimeStageListeners = [];
        this.dynamicStageListeners = [];
        this.runtimeStagePromise = (0, _promisewithresolvers.createPromiseWithResolvers)();
        this.dynamicStagePromise = (0, _promisewithresolvers.createPromiseWithResolvers)();
        this.mayAbandon = false;
        if (abortSignal) {
            abortSignal.addEventListener('abort', ()=>{
                const { reason } = abortSignal;
                if (this.currentStage < 3) {
                    this.runtimeStagePromise.promise.catch(ignoreReject) // avoid unhandled rejections
                    ;
                    this.runtimeStagePromise.reject(reason);
                }
                if (this.currentStage < 4 || this.currentStage === 5) {
                    this.dynamicStagePromise.promise.catch(ignoreReject) // avoid unhandled rejections
                    ;
                    this.dynamicStagePromise.reject(reason);
                }
            }, {
                once: true
            });
            this.mayAbandon = true;
        }
    }
    onStage(stage, callback) {
        if (this.currentStage >= stage) {
            callback();
        } else if (stage === 3) {
            this.runtimeStageListeners.push(callback);
        } else if (stage === 4) {
            this.dynamicStageListeners.push(callback);
        } else {
            // This should never happen
            throw Object.defineProperty(new _invarianterror.InvariantError(`Invalid render stage: ${stage}`), "__NEXT_ERROR_CODE", {
                value: "E881",
                enumerable: false,
                configurable: true
            });
        }
    }
    canSyncInterrupt() {
        // If we haven't started the render yet, it can't be interrupted.
        if (this.currentStage === 1) {
            return false;
        }
        const boundaryStage = this.hasRuntimePrefetch ? 4 : 3;
        return this.currentStage < boundaryStage;
    }
    syncInterruptCurrentStageWithReason(reason) {
        if (this.currentStage === 1) {
            return;
        }
        // If Sync IO occurs during the initial (abandonable) render, we'll retry it,
        // so we want a slightly different flow.
        // See the implementation of `abandonRenderImpl` for more explanation.
        if (this.mayAbandon) {
            return this.abandonRenderImpl();
        }
        // If we're in the final render, we cannot abandon it. We need to advance to the Dynamic stage
        // and capture the interruption reason.
        switch(this.currentStage){
            case 2:
                {
                    this.staticInterruptReason = reason;
                    this.advanceStage(4);
                    return;
                }
            case 3:
                {
                    // We only error for Sync IO in the runtime stage if the route
                    // is configured to use runtime prefetching.
                    // We do this to reflect the fact that during a runtime prefetch,
                    // Sync IO aborts aborts the render.
                    // Note that `canSyncInterrupt` should prevent us from getting here at all
                    // if runtime prefetching isn't enabled.
                    if (this.hasRuntimePrefetch) {
                        this.runtimeInterruptReason = reason;
                        this.advanceStage(4);
                    }
                    return;
                }
            case 4:
            case 5:
            default:
        }
    }
    getStaticInterruptReason() {
        return this.staticInterruptReason;
    }
    getRuntimeInterruptReason() {
        return this.runtimeInterruptReason;
    }
    getStaticStageEndTime() {
        return this.staticStageEndTime;
    }
    getRuntimeStageEndTime() {
        return this.runtimeStageEndTime;
    }
    abandonRender() {
        if (!this.mayAbandon) {
            throw Object.defineProperty(new _invarianterror.InvariantError('`abandonRender` called on a stage controller that cannot be abandoned.'), "__NEXT_ERROR_CODE", {
                value: "E938",
                enumerable: false,
                configurable: true
            });
        }
        this.abandonRenderImpl();
    }
    abandonRenderImpl() {
        // In staged rendering, only the initial render is abandonable.
        // We can abandon the initial render if
        //   1. We notice a cache miss, and need to wait for caches to fill
        //   2. A sync IO error occurs, and the render should be interrupted
        //      (this might be a lazy intitialization of a module,
        //       so we still want to restart in this case and see if it still occurs)
        // In either case, we'll be doing another render after this one,
        // so we only want to unblock the Runtime stage, not Dynamic, because
        // unblocking the dynamic stage would likely lead to wasted (uncached) IO.
        const { currentStage } = this;
        switch(currentStage){
            case 2:
                {
                    this.currentStage = 5;
                    this.resolveRuntimeStage();
                    return;
                }
            case 3:
                {
                    this.currentStage = 5;
                    return;
                }
            case 4:
            case 1:
            case 5:
                break;
            default:
                {
                    currentStage;
                }
        }
    }
    advanceStage(stage) {
        // If we're already at the target stage or beyond, do nothing.
        // (this can happen e.g. if sync IO advanced us to the dynamic stage)
        if (stage <= this.currentStage) {
            return;
        }
        let currentStage = this.currentStage;
        this.currentStage = stage;
        if (currentStage < 3 && stage >= 3) {
            this.staticStageEndTime = performance.now() + performance.timeOrigin;
            this.resolveRuntimeStage();
        }
        if (currentStage < 4 && stage >= 4) {
            this.runtimeStageEndTime = performance.now() + performance.timeOrigin;
            this.resolveDynamicStage();
            return;
        }
    }
    /** Fire the `onStage` listeners for the runtime stage and unblock any promises waiting for it. */ resolveRuntimeStage() {
        const runtimeListeners = this.runtimeStageListeners;
        for(let i = 0; i < runtimeListeners.length; i++){
            runtimeListeners[i]();
        }
        runtimeListeners.length = 0;
        this.runtimeStagePromise.resolve();
    }
    /** Fire the `onStage` listeners for the dynamic stage and unblock any promises waiting for it. */ resolveDynamicStage() {
        const dynamicListeners = this.dynamicStageListeners;
        for(let i = 0; i < dynamicListeners.length; i++){
            dynamicListeners[i]();
        }
        dynamicListeners.length = 0;
        this.dynamicStagePromise.resolve();
    }
    getStagePromise(stage) {
        switch(stage){
            case 3:
                {
                    return this.runtimeStagePromise.promise;
                }
            case 4:
                {
                    return this.dynamicStagePromise.promise;
                }
            default:
                {
                    stage;
                    throw Object.defineProperty(new _invarianterror.InvariantError(`Invalid render stage: ${stage}`), "__NEXT_ERROR_CODE", {
                        value: "E881",
                        enumerable: false,
                        configurable: true
                    });
                }
        }
    }
    waitForStage(stage) {
        return this.getStagePromise(stage);
    }
    delayUntilStage(stage, displayName, resolvedValue) {
        const ioTriggerPromise = this.getStagePromise(stage);
        const promise = makeDevtoolsIOPromiseFromIOTrigger(ioTriggerPromise, displayName, resolvedValue);
        // Analogously to `makeHangingPromise`, we might reject this promise if the signal is invoked.
        // (e.g. in the case where we don't want want the render to proceed to the dynamic stage and abort it).
        // We shouldn't consider this an unhandled rejection, so we attach a noop catch handler here to suppress this warning.
        if (this.abortSignal) {
            promise.catch(ignoreReject);
        }
        return promise;
    }
}
function ignoreReject() {}
// TODO(restart-on-cache-miss): the layering of `delayUntilStage`,
// `makeDevtoolsIOPromiseFromIOTrigger` and and `makeDevtoolsIOAwarePromise`
// is confusing, we should clean it up.
function makeDevtoolsIOPromiseFromIOTrigger(ioTrigger, displayName, resolvedValue) {
    // If we create a `new Promise` and give it a displayName
    // (with no userspace code above us in the stack)
    // React Devtools will use it as the IO cause when determining "suspended by".
    // In particular, it should shadow any inner IO that resolved/rejected the promise
    // (in case of staged rendering, this will be the `setTimeout` that triggers the relevant stage)
    const promise = new Promise((resolve, reject)=>{
        ioTrigger.then(resolve.bind(null, resolvedValue), reject);
    });
    if (displayName !== undefined) {
        // @ts-expect-error
        promise.displayName = displayName;
    }
    return promise;
} //# sourceMappingURL=staged-rendering.js.map
}),
"[project]/node_modules/next/dist/server/request/cookies.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cookies", {
    enumerable: true,
    get: function() {
        return cookies;
    }
});
const _requestcookies = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js [app-rsc] (ecmascript)");
const _cookies = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/cookies.js [app-rsc] (ecmascript)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _workunitasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)");
const _dynamicrendering = __turbopack_context__.r("[project]/node_modules/next/dist/server/app-render/dynamic-rendering.js [app-rsc] (ecmascript)");
const _staticgenerationbailout = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)");
const _dynamicrenderingutils = __turbopack_context__.r("[project]/node_modules/next/dist/server/dynamic-rendering-utils.js [app-rsc] (ecmascript)");
const _creatededupedbycallsiteservererrorlogger = __turbopack_context__.r("[project]/node_modules/next/dist/server/create-deduped-by-callsite-server-error-logger.js [app-rsc] (ecmascript)");
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/server/request/utils.js [app-rsc] (ecmascript)");
const _invarianterror = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
const _stagedrendering = __turbopack_context__.r("[project]/node_modules/next/dist/server/app-render/staged-rendering.js [app-rsc] (ecmascript)");
function cookies() {
    const callingExpression = 'cookies';
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (workStore) {
        if (workUnitStore && workUnitStore.phase === 'after' && !(0, _utils.isRequestAPICallableInsideAfter)()) {
            throw Object.defineProperty(new Error(`Route ${workStore.route} used \`cookies()\` inside \`after()\`. This is not supported. If you need this data inside an \`after()\` callback, use \`cookies()\` outside of the callback. See more info here: https://nextjs.org/docs/canary/app/api-reference/functions/after`), "__NEXT_ERROR_CODE", {
                value: "E843",
                enumerable: false,
                configurable: true
            });
        }
        if (workStore.forceStatic) {
            // When using forceStatic we override all other logic and always just return an empty
            // cookies object without tracking
            const underlyingCookies = createEmptyCookies();
            return makeUntrackedCookies(underlyingCookies);
        }
        if (workStore.dynamicShouldError) {
            throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${workStore.route} with \`dynamic = "error"\` couldn't be rendered statically because it used \`cookies()\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
                value: "E849",
                enumerable: false,
                configurable: true
            });
        }
        if (workUnitStore) {
            switch(workUnitStore.type){
                case 'cache':
                    const error = Object.defineProperty(new Error(`Route ${workStore.route} used \`cookies()\` inside "use cache". Accessing Dynamic data sources inside a cache scope is not supported. If you need this data inside a cached function use \`cookies()\` outside of the cached function and pass the required dynamic data in as an argument. See more info here: https://nextjs.org/docs/messages/next-request-in-use-cache`), "__NEXT_ERROR_CODE", {
                        value: "E831",
                        enumerable: false,
                        configurable: true
                    });
                    Error.captureStackTrace(error, cookies);
                    workStore.invalidDynamicUsageError ??= error;
                    throw error;
                case 'unstable-cache':
                    throw Object.defineProperty(new Error(`Route ${workStore.route} used \`cookies()\` inside a function cached with \`unstable_cache()\`. Accessing Dynamic data sources inside a cache scope is not supported. If you need this data inside a cached function use \`cookies()\` outside of the cached function and pass the required dynamic data in as an argument. See more info here: https://nextjs.org/docs/app/api-reference/functions/unstable_cache`), "__NEXT_ERROR_CODE", {
                        value: "E846",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender':
                    return makeHangingCookies(workStore, workUnitStore);
                case 'prerender-client':
                    const exportName = '`cookies`';
                    throw Object.defineProperty(new _invarianterror.InvariantError(`${exportName} must not be used within a Client Component. Next.js should be preventing ${exportName} from being included in Client Components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                        value: "E832",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender-ppr':
                    // We need track dynamic access here eagerly to keep continuity with
                    // how cookies has worked in PPR without cacheComponents.
                    return (0, _dynamicrendering.postponeWithTracking)(workStore.route, callingExpression, workUnitStore.dynamicTracking);
                case 'prerender-legacy':
                    // We track dynamic access here so we don't need to wrap the cookies
                    // in individual property access tracking.
                    return (0, _dynamicrendering.throwToInterruptStaticGeneration)(callingExpression, workStore, workUnitStore);
                case 'prerender-runtime':
                    return (0, _dynamicrendering.delayUntilRuntimeStage)(workUnitStore, makeUntrackedCookies(workUnitStore.cookies));
                case 'private-cache':
                    // Private caches are delayed until the runtime stage in use-cache-wrapper,
                    // so we don't need an additional delay here.
                    return makeUntrackedCookies(workUnitStore.cookies);
                case 'request':
                    (0, _dynamicrendering.trackDynamicDataInDynamicRender)(workUnitStore);
                    let underlyingCookies;
                    if ((0, _requestcookies.areCookiesMutableInCurrentPhase)(workUnitStore)) {
                        // We can't conditionally return different types here based on the context.
                        // To avoid confusion, we always return the readonly type here.
                        underlyingCookies = workUnitStore.userspaceMutableCookies;
                    } else {
                        underlyingCookies = workUnitStore.cookies;
                    }
                    if ("TURBOPACK compile-time truthy", 1) {
                        // Semantically we only need the dev tracking when running in `next dev`
                        // but since you would never use next dev with production NODE_ENV we use this
                        // as a proxy so we can statically exclude this code from production builds.
                        return makeUntrackedCookiesWithDevWarnings(workUnitStore, underlyingCookies, workStore == null ? void 0 : workStore.route);
                    } else //TURBOPACK unreachable
                    ;
                default:
                    workUnitStore;
            }
        }
    }
    // If we end up here, there was no work store or work unit store present.
    (0, _workunitasyncstorageexternal.throwForMissingRequestStore)(callingExpression);
}
function createEmptyCookies() {
    return _requestcookies.RequestCookiesAdapter.seal(new _cookies.RequestCookies(new Headers({})));
}
const CachedCookies = new WeakMap();
function makeHangingCookies(workStore, prerenderStore) {
    const cachedPromise = CachedCookies.get(prerenderStore);
    if (cachedPromise) {
        return cachedPromise;
    }
    const promise = (0, _dynamicrenderingutils.makeHangingPromise)(prerenderStore.renderSignal, workStore.route, '`cookies()`');
    CachedCookies.set(prerenderStore, promise);
    return promise;
}
function makeUntrackedCookies(underlyingCookies) {
    const cachedCookies = CachedCookies.get(underlyingCookies);
    if (cachedCookies) {
        return cachedCookies;
    }
    const promise = Promise.resolve(underlyingCookies);
    CachedCookies.set(underlyingCookies, promise);
    return promise;
}
function makeUntrackedCookiesWithDevWarnings(requestStore, underlyingCookies, route) {
    if (requestStore.asyncApiPromises) {
        let promise;
        if (underlyingCookies === requestStore.mutableCookies) {
            promise = requestStore.asyncApiPromises.mutableCookies;
        } else if (underlyingCookies === requestStore.cookies) {
            promise = requestStore.asyncApiPromises.cookies;
        } else {
            throw Object.defineProperty(new _invarianterror.InvariantError('Received an underlying cookies object that does not match either `cookies` or `mutableCookies`'), "__NEXT_ERROR_CODE", {
                value: "E890",
                enumerable: false,
                configurable: true
            });
        }
        return instrumentCookiesPromiseWithDevWarnings(promise, route);
    }
    const cachedCookies = CachedCookies.get(underlyingCookies);
    if (cachedCookies) {
        return cachedCookies;
    }
    const promise = (0, _dynamicrenderingutils.makeDevtoolsIOAwarePromise)(underlyingCookies, requestStore, _stagedrendering.RenderStage.Runtime);
    const proxiedPromise = instrumentCookiesPromiseWithDevWarnings(promise, route);
    CachedCookies.set(underlyingCookies, proxiedPromise);
    return proxiedPromise;
}
const warnForSyncAccess = (0, _creatededupedbycallsiteservererrorlogger.createDedupedByCallsiteServerErrorLoggerDev)(createCookiesAccessError);
function instrumentCookiesPromiseWithDevWarnings(promise, route) {
    Object.defineProperties(promise, {
        [Symbol.iterator]: replaceableWarningDescriptorForSymbolIterator(promise, route),
        size: replaceableWarningDescriptor(promise, 'size', route),
        get: replaceableWarningDescriptor(promise, 'get', route),
        getAll: replaceableWarningDescriptor(promise, 'getAll', route),
        has: replaceableWarningDescriptor(promise, 'has', route),
        set: replaceableWarningDescriptor(promise, 'set', route),
        delete: replaceableWarningDescriptor(promise, 'delete', route),
        clear: replaceableWarningDescriptor(promise, 'clear', route),
        toString: replaceableWarningDescriptor(promise, 'toString', route)
    });
    return promise;
}
function replaceableWarningDescriptor(target, prop, route) {
    return {
        enumerable: false,
        get () {
            warnForSyncAccess(route, `\`cookies().${prop}\``);
            return undefined;
        },
        set (value) {
            Object.defineProperty(target, prop, {
                value,
                writable: true,
                configurable: true
            });
        },
        configurable: true
    };
}
function replaceableWarningDescriptorForSymbolIterator(target, route) {
    return {
        enumerable: false,
        get () {
            warnForSyncAccess(route, '`...cookies()` or similar iteration');
            return undefined;
        },
        set (value) {
            Object.defineProperty(target, Symbol.iterator, {
                value,
                writable: true,
                enumerable: true,
                configurable: true
            });
        },
        configurable: true
    };
}
function createCookiesAccessError(route, expression) {
    const prefix = route ? `Route "${route}" ` : 'This route ';
    return Object.defineProperty(new Error(`${prefix}used ${expression}. ` + `\`cookies()\` returns a Promise and must be unwrapped with \`await\` or \`React.use()\` before accessing its properties. ` + `Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis`), "__NEXT_ERROR_CODE", {
        value: "E830",
        enumerable: false,
        configurable: true
    });
} //# sourceMappingURL=cookies.js.map
}),
"[project]/node_modules/next/dist/server/web/spec-extension/adapters/headers.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    HeadersAdapter: null,
    ReadonlyHeadersError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    HeadersAdapter: function() {
        return HeadersAdapter;
    },
    ReadonlyHeadersError: function() {
        return ReadonlyHeadersError;
    }
});
const _reflect = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js [app-rsc] (ecmascript)");
class ReadonlyHeadersError extends Error {
    constructor(){
        super('Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers');
    }
    static callable() {
        throw new ReadonlyHeadersError();
    }
}
class HeadersAdapter extends Headers {
    constructor(headers){
        // We've already overridden the methods that would be called, so we're just
        // calling the super constructor to ensure that the instanceof check works.
        super();
        this.headers = new Proxy(headers, {
            get (target, prop, receiver) {
                // Because this is just an object, we expect that all "get" operations
                // are for properties. If it's a "get" for a symbol, we'll just return
                // the symbol.
                if (typeof prop === 'symbol') {
                    return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return undefined.
                if (typeof original === 'undefined') return;
                // If the original casing exists, return the value.
                return _reflect.ReflectAdapter.get(target, original, receiver);
            },
            set (target, prop, value, receiver) {
                if (typeof prop === 'symbol') {
                    return _reflect.ReflectAdapter.set(target, prop, value, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, use the prop as the key.
                return _reflect.ReflectAdapter.set(target, original ?? prop, value, receiver);
            },
            has (target, prop) {
                if (typeof prop === 'symbol') return _reflect.ReflectAdapter.has(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return false.
                if (typeof original === 'undefined') return false;
                // If the original casing exists, return true.
                return _reflect.ReflectAdapter.has(target, original);
            },
            deleteProperty (target, prop) {
                if (typeof prop === 'symbol') return _reflect.ReflectAdapter.deleteProperty(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return true.
                if (typeof original === 'undefined') return true;
                // If the original casing exists, delete the property.
                return _reflect.ReflectAdapter.deleteProperty(target, original);
            }
        });
    }
    /**
   * Seals a Headers instance to prevent modification by throwing an error when
   * any mutating method is called.
   */ static seal(headers) {
        return new Proxy(headers, {
            get (target, prop, receiver) {
                switch(prop){
                    case 'append':
                    case 'delete':
                    case 'set':
                        return ReadonlyHeadersError.callable;
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
    /**
   * Merges a header value into a string. This stores multiple values as an
   * array, so we need to merge them into a string.
   *
   * @param value a header value
   * @returns a merged header value (a string)
   */ merge(value) {
        if (Array.isArray(value)) return value.join(', ');
        return value;
    }
    /**
   * Creates a Headers instance from a plain object or a Headers instance.
   *
   * @param headers a plain object or a Headers instance
   * @returns a headers instance
   */ static from(headers) {
        if (headers instanceof Headers) return headers;
        return new HeadersAdapter(headers);
    }
    append(name, value) {
        const existing = this.headers[name];
        if (typeof existing === 'string') {
            this.headers[name] = [
                existing,
                value
            ];
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            this.headers[name] = value;
        }
    }
    delete(name) {
        delete this.headers[name];
    }
    get(name) {
        const value = this.headers[name];
        if (typeof value !== 'undefined') return this.merge(value);
        return null;
    }
    has(name) {
        return typeof this.headers[name] !== 'undefined';
    }
    set(name, value) {
        this.headers[name] = value;
    }
    forEach(callbackfn, thisArg) {
        for (const [name, value] of this.entries()){
            callbackfn.call(thisArg, value, name, this);
        }
    }
    *entries() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(name);
            yield [
                name,
                value
            ];
        }
    }
    *keys() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            yield name;
        }
    }
    *values() {
        for (const key of Object.keys(this.headers)){
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(key);
            yield value;
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
} //# sourceMappingURL=headers.js.map
}),
"[project]/node_modules/next/dist/server/request/headers.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "headers", {
    enumerable: true,
    get: function() {
        return headers;
    }
});
const _headers = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/adapters/headers.js [app-rsc] (ecmascript)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _workunitasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)");
const _dynamicrendering = __turbopack_context__.r("[project]/node_modules/next/dist/server/app-render/dynamic-rendering.js [app-rsc] (ecmascript)");
const _staticgenerationbailout = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)");
const _dynamicrenderingutils = __turbopack_context__.r("[project]/node_modules/next/dist/server/dynamic-rendering-utils.js [app-rsc] (ecmascript)");
const _creatededupedbycallsiteservererrorlogger = __turbopack_context__.r("[project]/node_modules/next/dist/server/create-deduped-by-callsite-server-error-logger.js [app-rsc] (ecmascript)");
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/server/request/utils.js [app-rsc] (ecmascript)");
const _invarianterror = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
const _stagedrendering = __turbopack_context__.r("[project]/node_modules/next/dist/server/app-render/staged-rendering.js [app-rsc] (ecmascript)");
function headers() {
    const callingExpression = 'headers';
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (workStore) {
        if (workUnitStore && workUnitStore.phase === 'after' && !(0, _utils.isRequestAPICallableInsideAfter)()) {
            throw Object.defineProperty(new Error(`Route ${workStore.route} used \`headers()\` inside \`after()\`. This is not supported. If you need this data inside an \`after()\` callback, use \`headers()\` outside of the callback. See more info here: https://nextjs.org/docs/canary/app/api-reference/functions/after`), "__NEXT_ERROR_CODE", {
                value: "E839",
                enumerable: false,
                configurable: true
            });
        }
        if (workStore.forceStatic) {
            // When using forceStatic we override all other logic and always just return an empty
            // headers object without tracking
            const underlyingHeaders = _headers.HeadersAdapter.seal(new Headers({}));
            return makeUntrackedHeaders(underlyingHeaders);
        }
        if (workUnitStore) {
            switch(workUnitStore.type){
                case 'cache':
                    {
                        const error = Object.defineProperty(new Error(`Route ${workStore.route} used \`headers()\` inside "use cache". Accessing Dynamic data sources inside a cache scope is not supported. If you need this data inside a cached function use \`headers()\` outside of the cached function and pass the required dynamic data in as an argument. See more info here: https://nextjs.org/docs/messages/next-request-in-use-cache`), "__NEXT_ERROR_CODE", {
                            value: "E833",
                            enumerable: false,
                            configurable: true
                        });
                        Error.captureStackTrace(error, headers);
                        workStore.invalidDynamicUsageError ??= error;
                        throw error;
                    }
                case 'unstable-cache':
                    throw Object.defineProperty(new Error(`Route ${workStore.route} used \`headers()\` inside a function cached with \`unstable_cache()\`. Accessing Dynamic data sources inside a cache scope is not supported. If you need this data inside a cached function use \`headers()\` outside of the cached function and pass the required dynamic data in as an argument. See more info here: https://nextjs.org/docs/app/api-reference/functions/unstable_cache`), "__NEXT_ERROR_CODE", {
                        value: "E838",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender':
                case 'prerender-client':
                case 'private-cache':
                case 'prerender-runtime':
                case 'prerender-ppr':
                case 'prerender-legacy':
                case 'request':
                    break;
                default:
                    workUnitStore;
            }
        }
        if (workStore.dynamicShouldError) {
            throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${workStore.route} with \`dynamic = "error"\` couldn't be rendered statically because it used \`headers()\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
                value: "E828",
                enumerable: false,
                configurable: true
            });
        }
        if (workUnitStore) {
            switch(workUnitStore.type){
                case 'prerender':
                    return makeHangingHeaders(workStore, workUnitStore);
                case 'prerender-client':
                    const exportName = '`headers`';
                    throw Object.defineProperty(new _invarianterror.InvariantError(`${exportName} must not be used within a client component. Next.js should be preventing ${exportName} from being included in client components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                        value: "E693",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender-ppr':
                    // PPR Prerender (no cacheComponents)
                    // We are prerendering with PPR. We need track dynamic access here eagerly
                    // to keep continuity with how headers has worked in PPR without cacheComponents.
                    // TODO consider switching the semantic to throw on property access instead
                    return (0, _dynamicrendering.postponeWithTracking)(workStore.route, callingExpression, workUnitStore.dynamicTracking);
                case 'prerender-legacy':
                    // Legacy Prerender
                    // We are in a legacy static generation mode while prerendering
                    // We track dynamic access here so we don't need to wrap the headers in
                    // individual property access tracking.
                    return (0, _dynamicrendering.throwToInterruptStaticGeneration)(callingExpression, workStore, workUnitStore);
                case 'prerender-runtime':
                    return (0, _dynamicrendering.delayUntilRuntimeStage)(workUnitStore, makeUntrackedHeaders(workUnitStore.headers));
                case 'private-cache':
                    // Private caches are delayed until the runtime stage in use-cache-wrapper,
                    // so we don't need an additional delay here.
                    return makeUntrackedHeaders(workUnitStore.headers);
                case 'request':
                    (0, _dynamicrendering.trackDynamicDataInDynamicRender)(workUnitStore);
                    if ("TURBOPACK compile-time truthy", 1) {
                        // Semantically we only need the dev tracking when running in `next dev`
                        // but since you would never use next dev with production NODE_ENV we use this
                        // as a proxy so we can statically exclude this code from production builds.
                        return makeUntrackedHeadersWithDevWarnings(workUnitStore.headers, workStore == null ? void 0 : workStore.route, workUnitStore);
                    } else //TURBOPACK unreachable
                    ;
                    //TURBOPACK unreachable
                    ;
                default:
                    workUnitStore;
            }
        }
    }
    // If we end up here, there was no work store or work unit store present.
    (0, _workunitasyncstorageexternal.throwForMissingRequestStore)(callingExpression);
}
const CachedHeaders = new WeakMap();
function makeHangingHeaders(workStore, prerenderStore) {
    const cachedHeaders = CachedHeaders.get(prerenderStore);
    if (cachedHeaders) {
        return cachedHeaders;
    }
    const promise = (0, _dynamicrenderingutils.makeHangingPromise)(prerenderStore.renderSignal, workStore.route, '`headers()`');
    CachedHeaders.set(prerenderStore, promise);
    return promise;
}
function makeUntrackedHeaders(underlyingHeaders) {
    const cachedHeaders = CachedHeaders.get(underlyingHeaders);
    if (cachedHeaders) {
        return cachedHeaders;
    }
    const promise = Promise.resolve(underlyingHeaders);
    CachedHeaders.set(underlyingHeaders, promise);
    return promise;
}
function makeUntrackedHeadersWithDevWarnings(underlyingHeaders, route, requestStore) {
    if (requestStore.asyncApiPromises) {
        const promise = requestStore.asyncApiPromises.headers;
        return instrumentHeadersPromiseWithDevWarnings(promise, route);
    }
    const cachedHeaders = CachedHeaders.get(underlyingHeaders);
    if (cachedHeaders) {
        return cachedHeaders;
    }
    const promise = (0, _dynamicrenderingutils.makeDevtoolsIOAwarePromise)(underlyingHeaders, requestStore, _stagedrendering.RenderStage.Runtime);
    const proxiedPromise = instrumentHeadersPromiseWithDevWarnings(promise, route);
    CachedHeaders.set(underlyingHeaders, proxiedPromise);
    return proxiedPromise;
}
const warnForSyncAccess = (0, _creatededupedbycallsiteservererrorlogger.createDedupedByCallsiteServerErrorLoggerDev)(createHeadersAccessError);
function instrumentHeadersPromiseWithDevWarnings(promise, route) {
    Object.defineProperties(promise, {
        [Symbol.iterator]: replaceableWarningDescriptorForSymbolIterator(promise, route),
        append: replaceableWarningDescriptor(promise, 'append', route),
        delete: replaceableWarningDescriptor(promise, 'delete', route),
        get: replaceableWarningDescriptor(promise, 'get', route),
        has: replaceableWarningDescriptor(promise, 'has', route),
        set: replaceableWarningDescriptor(promise, 'set', route),
        getSetCookie: replaceableWarningDescriptor(promise, 'getSetCookie', route),
        forEach: replaceableWarningDescriptor(promise, 'forEach', route),
        keys: replaceableWarningDescriptor(promise, 'keys', route),
        values: replaceableWarningDescriptor(promise, 'values', route),
        entries: replaceableWarningDescriptor(promise, 'entries', route)
    });
    return promise;
}
function replaceableWarningDescriptor(target, prop, route) {
    return {
        enumerable: false,
        get () {
            warnForSyncAccess(route, `\`headers().${prop}\``);
            return undefined;
        },
        set (value) {
            Object.defineProperty(target, prop, {
                value,
                writable: true,
                configurable: true
            });
        },
        configurable: true
    };
}
function replaceableWarningDescriptorForSymbolIterator(target, route) {
    return {
        enumerable: false,
        get () {
            warnForSyncAccess(route, '`...headers()` or similar iteration');
            return undefined;
        },
        set (value) {
            Object.defineProperty(target, Symbol.iterator, {
                value,
                writable: true,
                enumerable: true,
                configurable: true
            });
        },
        configurable: true
    };
}
function createHeadersAccessError(route, expression) {
    const prefix = route ? `Route "${route}" ` : 'This route ';
    return Object.defineProperty(new Error(`${prefix}used ${expression}. ` + `\`headers()\` returns a Promise and must be unwrapped with \`await\` or \`React.use()\` before accessing its properties. ` + `Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis`), "__NEXT_ERROR_CODE", {
        value: "E836",
        enumerable: false,
        configurable: true
    });
} //# sourceMappingURL=headers.js.map
}),
"[project]/node_modules/next/dist/server/request/draft-mode.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "draftMode", {
    enumerable: true,
    get: function() {
        return draftMode;
    }
});
const _workunitasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _dynamicrendering = __turbopack_context__.r("[project]/node_modules/next/dist/server/app-render/dynamic-rendering.js [app-rsc] (ecmascript)");
const _creatededupedbycallsiteservererrorlogger = __turbopack_context__.r("[project]/node_modules/next/dist/server/create-deduped-by-callsite-server-error-logger.js [app-rsc] (ecmascript)");
const _staticgenerationbailout = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/static-generation-bailout.js [app-rsc] (ecmascript)");
const _hooksservercontext = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/hooks-server-context.js [app-rsc] (ecmascript)");
const _invarianterror = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/invariant-error.js [app-rsc] (ecmascript)");
const _reflect = __turbopack_context__.r("[project]/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js [app-rsc] (ecmascript)");
function draftMode() {
    const callingExpression = 'draftMode';
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (!workStore || !workUnitStore) {
        (0, _workunitasyncstorageexternal.throwForMissingRequestStore)(callingExpression);
    }
    switch(workUnitStore.type){
        case 'prerender-runtime':
            // TODO(runtime-ppr): does it make sense to delay this? normally it's always microtasky
            return (0, _dynamicrendering.delayUntilRuntimeStage)(workUnitStore, createOrGetCachedDraftMode(workUnitStore.draftMode, workStore));
        case 'request':
            return createOrGetCachedDraftMode(workUnitStore.draftMode, workStore);
        case 'cache':
        case 'private-cache':
        case 'unstable-cache':
            // Inside of `"use cache"` or `unstable_cache`, draft mode is available if
            // the outmost work unit store is a request store (or a runtime prerender),
            // and if draft mode is enabled.
            const draftModeProvider = (0, _workunitasyncstorageexternal.getDraftModeProviderForCacheScope)(workStore, workUnitStore);
            if (draftModeProvider) {
                return createOrGetCachedDraftMode(draftModeProvider, workStore);
            }
        // Otherwise, we fall through to providing an empty draft mode.
        // eslint-disable-next-line no-fallthrough
        case 'prerender':
        case 'prerender-client':
        case 'prerender-ppr':
        case 'prerender-legacy':
            // Return empty draft mode
            return createOrGetCachedDraftMode(null, workStore);
        default:
            return workUnitStore;
    }
}
function createOrGetCachedDraftMode(draftModeProvider, workStore) {
    const cacheKey = draftModeProvider ?? NullDraftMode;
    const cachedDraftMode = CachedDraftModes.get(cacheKey);
    if (cachedDraftMode) {
        return cachedDraftMode;
    }
    if (("TURBOPACK compile-time value", "development") === 'development' && !(workStore == null ? void 0 : workStore.isPrefetchRequest)) {
        const route = workStore == null ? void 0 : workStore.route;
        return createDraftModeWithDevWarnings(draftModeProvider, route);
    } else {
        return Promise.resolve(new DraftMode(draftModeProvider));
    }
}
const NullDraftMode = {};
const CachedDraftModes = new WeakMap();
function createDraftModeWithDevWarnings(underlyingProvider, route) {
    const instance = new DraftMode(underlyingProvider);
    const promise = Promise.resolve(instance);
    const proxiedPromise = new Proxy(promise, {
        get (target, prop, receiver) {
            switch(prop){
                case 'isEnabled':
                    warnForSyncAccess(route, `\`draftMode().${prop}\``);
                    break;
                case 'enable':
                case 'disable':
                    {
                        warnForSyncAccess(route, `\`draftMode().${prop}()\``);
                        break;
                    }
                default:
                    {
                    // We only warn for well-defined properties of the draftMode object.
                    }
            }
            return _reflect.ReflectAdapter.get(target, prop, receiver);
        }
    });
    return proxiedPromise;
}
class DraftMode {
    constructor(provider){
        this._provider = provider;
    }
    get isEnabled() {
        if (this._provider !== null) {
            return this._provider.isEnabled;
        }
        return false;
    }
    enable() {
        // We have a store we want to track dynamic data access to ensure we
        // don't statically generate routes that manipulate draft mode.
        trackDynamicDraftMode('draftMode().enable()', this.enable);
        if (this._provider !== null) {
            this._provider.enable();
        }
    }
    disable() {
        trackDynamicDraftMode('draftMode().disable()', this.disable);
        if (this._provider !== null) {
            this._provider.disable();
        }
    }
}
const warnForSyncAccess = (0, _creatededupedbycallsiteservererrorlogger.createDedupedByCallsiteServerErrorLoggerDev)(createDraftModeAccessError);
function createDraftModeAccessError(route, expression) {
    const prefix = route ? `Route "${route}" ` : 'This route ';
    return Object.defineProperty(new Error(`${prefix}used ${expression}. ` + `\`draftMode()\` returns a Promise and must be unwrapped with \`await\` or \`React.use()\` before accessing its properties. ` + `Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis`), "__NEXT_ERROR_CODE", {
        value: "E835",
        enumerable: false,
        configurable: true
    });
}
function trackDynamicDraftMode(expression, constructorOpt) {
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
    if (workStore) {
        // We have a store we want to track dynamic data access to ensure we
        // don't statically generate routes that manipulate draft mode.
        if ((workUnitStore == null ? void 0 : workUnitStore.phase) === 'after') {
            throw Object.defineProperty(new Error(`Route ${workStore.route} used "${expression}" inside \`after()\`. The enabled status of \`draftMode()\` can be read inside \`after()\` but you cannot enable or disable \`draftMode()\`. See more info here: https://nextjs.org/docs/app/api-reference/functions/after`), "__NEXT_ERROR_CODE", {
                value: "E845",
                enumerable: false,
                configurable: true
            });
        }
        if (workStore.dynamicShouldError) {
            throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${workStore.route} with \`dynamic = "error"\` couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
                value: "E553",
                enumerable: false,
                configurable: true
            });
        }
        if (workUnitStore) {
            switch(workUnitStore.type){
                case 'cache':
                case 'private-cache':
                    {
                        const error = Object.defineProperty(new Error(`Route ${workStore.route} used "${expression}" inside "use cache". The enabled status of \`draftMode()\` can be read in caches but you must not enable or disable \`draftMode()\` inside a cache. See more info here: https://nextjs.org/docs/messages/next-request-in-use-cache`), "__NEXT_ERROR_CODE", {
                            value: "E829",
                            enumerable: false,
                            configurable: true
                        });
                        Error.captureStackTrace(error, constructorOpt);
                        workStore.invalidDynamicUsageError ??= error;
                        throw error;
                    }
                case 'unstable-cache':
                    throw Object.defineProperty(new Error(`Route ${workStore.route} used "${expression}" inside a function cached with \`unstable_cache()\`. The enabled status of \`draftMode()\` can be read in caches but you must not enable or disable \`draftMode()\` inside a cache. See more info here: https://nextjs.org/docs/app/api-reference/functions/unstable_cache`), "__NEXT_ERROR_CODE", {
                        value: "E844",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender':
                case 'prerender-runtime':
                    {
                        const error = Object.defineProperty(new Error(`Route ${workStore.route} used ${expression} without first calling \`await connection()\`. See more info here: https://nextjs.org/docs/messages/next-prerender-sync-headers`), "__NEXT_ERROR_CODE", {
                            value: "E126",
                            enumerable: false,
                            configurable: true
                        });
                        return (0, _dynamicrendering.abortAndThrowOnSynchronousRequestDataAccess)(workStore.route, expression, error, workUnitStore);
                    }
                case 'prerender-client':
                    const exportName = '`draftMode`';
                    throw Object.defineProperty(new _invarianterror.InvariantError(`${exportName} must not be used within a Client Component. Next.js should be preventing ${exportName} from being included in Client Components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
                        value: "E832",
                        enumerable: false,
                        configurable: true
                    });
                case 'prerender-ppr':
                    return (0, _dynamicrendering.postponeWithTracking)(workStore.route, expression, workUnitStore.dynamicTracking);
                case 'prerender-legacy':
                    workUnitStore.revalidate = 0;
                    const err = Object.defineProperty(new _hooksservercontext.DynamicServerError(`Route ${workStore.route} couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`), "__NEXT_ERROR_CODE", {
                        value: "E558",
                        enumerable: false,
                        configurable: true
                    });
                    workStore.dynamicUsageDescription = expression;
                    workStore.dynamicUsageStack = err.stack;
                    throw err;
                case 'request':
                    (0, _dynamicrendering.trackDynamicDataInDynamicRender)(workUnitStore);
                    break;
                default:
                    workUnitStore;
            }
        }
    }
} //# sourceMappingURL=draft-mode.js.map
}),
"[project]/node_modules/next/headers.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports.cookies = __turbopack_context__.r("[project]/node_modules/next/dist/server/request/cookies.js [app-rsc] (ecmascript)").cookies;
module.exports.headers = __turbopack_context__.r("[project]/node_modules/next/dist/server/request/headers.js [app-rsc] (ecmascript)").headers;
module.exports.draftMode = __turbopack_context__.r("[project]/node_modules/next/dist/server/request/draft-mode.js [app-rsc] (ecmascript)").draftMode;
}),
"[externals]/firebase-admin [external] (firebase-admin, cjs, [project]/node_modules/firebase-admin)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("firebase-admin-a14c8a5423a75469", () => require("firebase-admin-a14c8a5423a75469"));

module.exports = mod;
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
} //# sourceMappingURL=action-validate.js.map
}),
"[project]/node_modules/svix/dist/models/applicationIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApplicationInSerializer = void 0;
exports.ApplicationInSerializer = {
    _fromJsonObject (object) {
        return {
            metadata: object["metadata"],
            name: object["name"],
            rateLimit: object["rateLimit"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        return {
            metadata: self.metadata,
            name: self.name,
            rateLimit: self.rateLimit,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=applicationIn.js.map
}),
"[project]/node_modules/svix/dist/models/applicationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApplicationOutSerializer = void 0;
exports.ApplicationOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            id: object["id"],
            metadata: object["metadata"],
            name: object["name"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            id: self.id,
            metadata: self.metadata,
            name: self.name,
            rateLimit: self.rateLimit,
            uid: self.uid,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=applicationOut.js.map
}),
"[project]/node_modules/svix/dist/models/applicationPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApplicationPatchSerializer = void 0;
exports.ApplicationPatchSerializer = {
    _fromJsonObject (object) {
        return {
            metadata: object["metadata"],
            name: object["name"],
            rateLimit: object["rateLimit"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        return {
            metadata: self.metadata,
            name: self.name,
            rateLimit: self.rateLimit,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=applicationPatch.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseApplicationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseApplicationOutSerializer = void 0;
const applicationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationOut.js [app-rsc] (ecmascript)");
exports.ListResponseApplicationOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseApplicationOut.js.map
}),
"[project]/node_modules/svix/dist/util.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApiException = void 0;
class ApiException extends Error {
    constructor(code, body, headers){
        super(`HTTP-Code: ${code}\nHeaders: ${JSON.stringify(headers)}`);
        this.code = code;
        this.body = body;
        this.headers = {};
        headers.forEach((value, name)=>{
            this.headers[name] = value;
        });
    }
}
exports.ApiException = ApiException; //# sourceMappingURL=util.js.map
}),
"[project]/node_modules/uuid/dist/esm-node/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/node_modules/uuid/dist/esm-node/max.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
const __TURBOPACK__default__export__ = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
}),
"[project]/node_modules/uuid/dist/esm-node/nil.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
const __TURBOPACK__default__export__ = '00000000-0000-0000-0000-000000000000';
}),
"[project]/node_modules/uuid/dist/esm-node/regex.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
const __TURBOPACK__default__export__ = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
}),
"[project]/node_modules/uuid/dist/esm-node/validate.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$regex$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/regex.js [app-rsc] (ecmascript)");
;
function validate(uuid) {
    return typeof uuid === 'string' && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$regex$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].test(uuid);
}
const __TURBOPACK__default__export__ = validate;
}),
"[project]/node_modules/uuid/dist/esm-node/parse.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/validate.js [app-rsc] (ecmascript)");
;
function parse(uuid) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(uuid)) {
        throw TypeError('Invalid UUID');
    }
    let v;
    const arr = new Uint8Array(16);
    // Parse ########-....-....-....-............
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 0xff;
    arr[2] = v >>> 8 & 0xff;
    arr[3] = v & 0xff;
    // Parse ........-####-....-....-............
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 0xff;
    // Parse ........-....-####-....-............
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 0xff;
    // Parse ........-....-....-####-............
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 0xff;
    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
    arr[11] = v / 0x100000000 & 0xff;
    arr[12] = v >>> 24 & 0xff;
    arr[13] = v >>> 16 & 0xff;
    arr[14] = v >>> 8 & 0xff;
    arr[15] = v & 0xff;
    return arr;
}
const __TURBOPACK__default__export__ = parse;
}),
"[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "unsafeStringify",
    ()=>unsafeStringify
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/validate.js [app-rsc] (ecmascript)");
;
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */ const byteToHex = [];
for(let i = 0; i < 256; ++i){
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    //
    // Note to future-self: No, you can't remove the `toLowerCase()` call.
    // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    // Consistency check for valid UUID.  If this throws, it's likely due to one
    // of the following:
    // - One or more input array values don't map to a hex octet (leading to
    // "undefined" in the uuid)
    // - Invalid input values for the RFC `version` or `variant` fields
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
const __TURBOPACK__default__export__ = stringify;
}),
"[project]/node_modules/uuid/dist/esm-node/rng.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>rng
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate
let poolPtr = rnds8Pool.length;
function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomFillSync(rnds8Pool);
        poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
}),
"[project]/node_modules/uuid/dist/esm-node/v1.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/rng.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
;
;
// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;
let _clockseq;
// Previous uuid creation time
let _lastMSecs = 0;
let _lastNSecs = 0;
// See https://github.com/uuidjs/uuid for API details
function v1(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node;
    let clockseq = options.clockseq;
    // v1 only: Use cached `node` and `clockseq` values
    if (!options._v6) {
        if (!node) {
            node = _nodeId;
        }
        if (clockseq == null) {
            clockseq = _clockseq;
        }
    }
    // Handle cases where we need entropy.  We do this lazily to minimize issues
    // related to insufficient system entropy.  See #189
    if (node == null || clockseq == null) {
        const seedBytes = options.random || (options.rng || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
        // Randomize node
        if (node == null) {
            node = [
                seedBytes[0],
                seedBytes[1],
                seedBytes[2],
                seedBytes[3],
                seedBytes[4],
                seedBytes[5]
            ];
            // v1 only: cache node value for reuse
            if (!_nodeId && !options._v6) {
                // per RFC4122 4.5: Set MAC multicast bit (v1 only)
                node[0] |= 0x01; // Set multicast bit
                _nodeId = node;
            }
        }
        // Randomize clockseq
        if (clockseq == null) {
            // Per 4.2.2, randomize (14 bit) clockseq
            clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
            if (_clockseq === undefined && !options._v6) {
                _clockseq = clockseq;
            }
        }
    }
    // v1 & v6 timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so time is
    // handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    let msecs = options.msecs !== undefined ? options.msecs : Date.now();
    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
    // Time since last uuid creation (in msecs)
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000;
    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq === undefined) {
        clockseq = clockseq + 1 & 0x3fff;
    }
    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
        nsecs = 0;
    }
    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
        throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;
    // `time_low`
    const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;
    // `time_mid`
    const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;
    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;
    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;
    // `clock_seq_low`
    b[i++] = clockseq & 0xff;
    // `node`
    for(let n = 0; n < 6; ++n){
        b[i + n] = node[n];
    }
    return buf || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(b);
}
const __TURBOPACK__default__export__ = v1;
}),
"[project]/node_modules/uuid/dist/esm-node/v1ToV6.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>v1ToV6
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
;
;
function v1ToV6(uuid) {
    const v1Bytes = typeof uuid === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(uuid) : uuid;
    const v6Bytes = _v1ToV6(v1Bytes);
    return typeof uuid === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(v6Bytes) : v6Bytes;
}
// Do the field transformation needed for v1 -> v6
function _v1ToV6(v1Bytes, randomize = false) {
    return Uint8Array.of((v1Bytes[6] & 0x0f) << 4 | v1Bytes[7] >> 4 & 0x0f, (v1Bytes[7] & 0x0f) << 4 | (v1Bytes[4] & 0xf0) >> 4, (v1Bytes[4] & 0x0f) << 4 | (v1Bytes[5] & 0xf0) >> 4, (v1Bytes[5] & 0x0f) << 4 | (v1Bytes[0] & 0xf0) >> 4, (v1Bytes[0] & 0x0f) << 4 | (v1Bytes[1] & 0xf0) >> 4, (v1Bytes[1] & 0x0f) << 4 | (v1Bytes[2] & 0xf0) >> 4, 0x60 | v1Bytes[2] & 0x0f, v1Bytes[3], v1Bytes[8], v1Bytes[9], v1Bytes[10], v1Bytes[11], v1Bytes[12], v1Bytes[13], v1Bytes[14], v1Bytes[15]);
}
}),
"[project]/node_modules/uuid/dist/esm-node/v35.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DNS",
    ()=>DNS,
    "URL",
    ()=>URL,
    "default",
    ()=>v35
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/parse.js [app-rsc] (ecmascript)");
;
;
function stringToBytes(str) {
    str = unescape(encodeURIComponent(str)); // UTF8 escape
    const bytes = [];
    for(let i = 0; i < str.length; ++i){
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}
const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35(name, version, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
        var _namespace;
        if (typeof value === 'string') {
            value = stringToBytes(value);
        }
        if (typeof namespace === 'string') {
            namespace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(namespace);
        }
        if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
            throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
        }
        // Compute hash of namespace and value, Per 4.3
        // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
        // hashfunc([...namespace, ... value])`
        let bytes = new Uint8Array(16 + value.length);
        bytes.set(namespace);
        bytes.set(value, namespace.length);
        bytes = hashfunc(bytes);
        bytes[6] = bytes[6] & 0x0f | version;
        bytes[8] = bytes[8] & 0x3f | 0x80;
        if (buf) {
            offset = offset || 0;
            for(let i = 0; i < 16; ++i){
                buf[offset + i] = bytes[i];
            }
            return buf;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(bytes);
    }
    // Function#name is not settable on some platforms (#270)
    try {
        generateUUID.name = name;
    } catch (err) {}
    // For CommonJS default export support
    generateUUID.DNS = DNS;
    generateUUID.URL = URL;
    return generateUUID;
}
}),
"[project]/node_modules/uuid/dist/esm-node/md5.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
function md5(bytes) {
    if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
    } else if (typeof bytes === 'string') {
        bytes = Buffer.from(bytes, 'utf8');
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash('md5').update(bytes).digest();
}
const __TURBOPACK__default__export__ = md5;
}),
"[project]/node_modules/uuid/dist/esm-node/v3.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v35$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v35.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$md5$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/md5.js [app-rsc] (ecmascript)");
;
;
const v3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v35$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])('v3', 0x30, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$md5$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]);
const __TURBOPACK__default__export__ = v3;
}),
"[project]/node_modules/uuid/dist/esm-node/native.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
const __TURBOPACK__default__export__ = {
    randomUUID: __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomUUID
};
}),
"[project]/node_modules/uuid/dist/esm-node/v4.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$native$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/native.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/rng.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
;
;
;
function v4(options, buf, offset) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$native$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].randomUUID && !buf && !options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$native$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    // Copy bytes to buffer, if provided
    if (buf) {
        offset = offset || 0;
        for(let i = 0; i < 16; ++i){
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(rnds);
}
const __TURBOPACK__default__export__ = v4;
}),
"[project]/node_modules/uuid/dist/esm-node/sha1.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
function sha1(bytes) {
    if (Array.isArray(bytes)) {
        bytes = Buffer.from(bytes);
    } else if (typeof bytes === 'string') {
        bytes = Buffer.from(bytes, 'utf8');
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash('sha1').update(bytes).digest();
}
const __TURBOPACK__default__export__ = sha1;
}),
"[project]/node_modules/uuid/dist/esm-node/v5.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v35$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v35.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$sha1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/sha1.js [app-rsc] (ecmascript)");
;
;
const v5 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v35$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])('v5', 0x50, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$sha1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]);
const __TURBOPACK__default__export__ = v5;
}),
"[project]/node_modules/uuid/dist/esm-node/v6.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>v6
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v1.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1ToV6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v1ToV6.js [app-rsc] (ecmascript)");
;
;
;
function v6(options = {}, buf, offset = 0) {
    // v6 is v1 with different field layout, so we start with a v1 UUID, albeit
    // with slightly different behavior around how the clock_seq and node fields
    // are randomized, which is why we call v1 with _v6: true.
    let bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])({
        ...options,
        _v6: true
    }, new Uint8Array(16));
    // Reorder the fields to v6 layout.
    bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1ToV6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(bytes);
    // Return as a byte array if requested
    if (buf) {
        for(let i = 0; i < 16; i++){
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(bytes);
}
}),
"[project]/node_modules/uuid/dist/esm-node/v6ToV1.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>v6ToV1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
;
;
function v6ToV1(uuid) {
    const v6Bytes = typeof uuid === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(uuid) : uuid;
    const v1Bytes = _v6ToV1(v6Bytes);
    return typeof uuid === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(v1Bytes) : v1Bytes;
}
// Do the field transformation needed for v6 -> v1
function _v6ToV1(v6Bytes) {
    return Uint8Array.of((v6Bytes[3] & 0x0f) << 4 | v6Bytes[4] >> 4 & 0x0f, (v6Bytes[4] & 0x0f) << 4 | (v6Bytes[5] & 0xf0) >> 4, (v6Bytes[5] & 0x0f) << 4 | v6Bytes[6] & 0x0f, v6Bytes[7], (v6Bytes[1] & 0x0f) << 4 | (v6Bytes[2] & 0xf0) >> 4, (v6Bytes[2] & 0x0f) << 4 | (v6Bytes[3] & 0xf0) >> 4, 0x10 | (v6Bytes[0] & 0xf0) >> 4, (v6Bytes[0] & 0x0f) << 4 | (v6Bytes[1] & 0xf0) >> 4, v6Bytes[8], v6Bytes[9], v6Bytes[10], v6Bytes[11], v6Bytes[12], v6Bytes[13], v6Bytes[14], v6Bytes[15]);
}
}),
"[project]/node_modules/uuid/dist/esm-node/v7.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/rng.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
;
;
/**
 * UUID V7 - Unix Epoch time-based UUID
 *
 * The IETF has published RFC9562, introducing 3 new UUID versions (6,7,8). This
 * implementation of V7 is based on the accepted, though not yet approved,
 * revisions.
 *
 * RFC 9562:https://www.rfc-editor.org/rfc/rfc9562.html Universally Unique
 * IDentifiers (UUIDs)

 *
 * Sample V7 value:
 * https://www.rfc-editor.org/rfc/rfc9562.html#name-example-of-a-uuidv7-value
 *
 * Monotonic Bit Layout: RFC rfc9562.6.2 Method 1, Dedicated Counter Bits ref:
 *     https://www.rfc-editor.org/rfc/rfc9562.html#section-6.2-5.1
 *
 *   0                   1                   2                   3 0 1 2 3 4 5 6
 *   7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                          unix_ts_ms                           |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |          unix_ts_ms           |  ver  |        seq_hi         |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |var|               seq_low               |        rand         |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                             rand                              |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *
 * seq is a 31 bit serialized counter; comprised of 12 bit seq_hi and 19 bit
 * seq_low, and randomly initialized upon timestamp change. 31 bit counter size
 * was selected as any bitwise operations in node are done as _signed_ 32 bit
 * ints. we exclude the sign bit.
 */ let _seqLow = null;
let _seqHigh = null;
let _msecs = 0;
function v7(options, buf, offset) {
    options = options || {};
    // initialize buffer and pointer
    let i = buf && offset || 0;
    const b = buf || new Uint8Array(16);
    // rnds is Uint8Array(16) filled with random bytes
    const rnds = options.random || (options.rng || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$rng$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    // milliseconds since unix epoch, 1970-01-01 00:00
    const msecs = options.msecs !== undefined ? options.msecs : Date.now();
    // seq is user provided 31 bit counter
    let seq = options.seq !== undefined ? options.seq : null;
    // initialize local seq high/low parts
    let seqHigh = _seqHigh;
    let seqLow = _seqLow;
    // check if clock has advanced and user has not provided msecs
    if (msecs > _msecs && options.msecs === undefined) {
        _msecs = msecs;
        // unless user provided seq, reset seq parts
        if (seq !== null) {
            seqHigh = null;
            seqLow = null;
        }
    }
    // if we have a user provided seq
    if (seq !== null) {
        // trim provided seq to 31 bits of value, avoiding overflow
        if (seq > 0x7fffffff) {
            seq = 0x7fffffff;
        }
        // split provided seq into high/low parts
        seqHigh = seq >>> 19 & 0xfff;
        seqLow = seq & 0x7ffff;
    }
    // randomly initialize seq
    if (seqHigh === null || seqLow === null) {
        seqHigh = rnds[6] & 0x7f;
        seqHigh = seqHigh << 8 | rnds[7];
        seqLow = rnds[8] & 0x3f; // pad for var
        seqLow = seqLow << 8 | rnds[9];
        seqLow = seqLow << 5 | rnds[10] >>> 3;
    }
    // increment seq if within msecs window
    if (msecs + 10000 > _msecs && seq === null) {
        if (++seqLow > 0x7ffff) {
            seqLow = 0;
            if (++seqHigh > 0xfff) {
                seqHigh = 0;
                // increment internal _msecs. this allows us to continue incrementing
                // while staying monotonic. Note, once we hit 10k milliseconds beyond system
                // clock, we will reset breaking monotonicity (after (2^31)*10000 generations)
                _msecs++;
            }
        }
    } else {
        // resetting; we have advanced more than
        // 10k milliseconds beyond system clock
        _msecs = msecs;
    }
    _seqHigh = seqHigh;
    _seqLow = seqLow;
    // [bytes 0-5] 48 bits of local timestamp
    b[i++] = _msecs / 0x10000000000 & 0xff;
    b[i++] = _msecs / 0x100000000 & 0xff;
    b[i++] = _msecs / 0x1000000 & 0xff;
    b[i++] = _msecs / 0x10000 & 0xff;
    b[i++] = _msecs / 0x100 & 0xff;
    b[i++] = _msecs & 0xff;
    // [byte 6] - set 4 bits of version (7) with first 4 bits seq_hi
    b[i++] = seqHigh >>> 4 & 0x0f | 0x70;
    // [byte 7] remaining 8 bits of seq_hi
    b[i++] = seqHigh & 0xff;
    // [byte 8] - variant (2 bits), first 6 bits seq_low
    b[i++] = seqLow >>> 13 & 0x3f | 0x80;
    // [byte 9] 8 bits seq_low
    b[i++] = seqLow >>> 5 & 0xff;
    // [byte 10] remaining 5 bits seq_low, 3 bits random
    b[i++] = seqLow << 3 & 0xff | rnds[10] & 0x07;
    // [bytes 11-15] always random
    b[i++] = rnds[11];
    b[i++] = rnds[12];
    b[i++] = rnds[13];
    b[i++] = rnds[14];
    b[i++] = rnds[15];
    return buf || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unsafeStringify"])(b);
}
const __TURBOPACK__default__export__ = v7;
}),
"[project]/node_modules/uuid/dist/esm-node/version.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/validate.js [app-rsc] (ecmascript)");
;
function version(uuid) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(uuid)) {
        throw TypeError('Invalid UUID');
    }
    return parseInt(uuid.slice(14, 15), 16);
}
const __TURBOPACK__default__export__ = version;
}),
"[project]/node_modules/uuid/dist/esm-node/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$max$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "NIL",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$nil$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "parse",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "stringify",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v1ToV6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1ToV6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v3$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v4",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v5$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v6ToV1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v6ToV1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "v7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v7$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "validate",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "version",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$version$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$max$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/max.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$nil$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/nil.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v1.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v1ToV6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v1ToV6.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v3$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v3.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v4$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v4.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v5$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v5.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v6$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v6.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v6ToV1$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v6ToV1.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$v7$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/v7.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/validate.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$node$2f$version$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-node/version.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SvixRequest = exports.HttpMethod = exports.LIB_VERSION = void 0;
const util_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/util.js [app-rsc] (ecmascript)");
const uuid_1 = __turbopack_context__.r("[project]/node_modules/uuid/dist/esm-node/index.js [app-rsc] (ecmascript)");
exports.LIB_VERSION = "1.84.1";
const USER_AGENT = `svix-libs/${exports.LIB_VERSION}/javascript`;
var HttpMethod;
(function(HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["CONNECT"] = "CONNECT";
    HttpMethod["OPTIONS"] = "OPTIONS";
    HttpMethod["TRACE"] = "TRACE";
    HttpMethod["PATCH"] = "PATCH";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
class SvixRequest {
    constructor(method, path){
        this.method = method;
        this.path = path;
        this.queryParams = {};
        this.headerParams = {};
    }
    setPathParam(name, value) {
        const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
        if (this.path === newPath) {
            throw new Error(`path parameter ${name} not found`);
        }
        this.path = newPath;
    }
    setQueryParams(params) {
        for (const [name, value] of Object.entries(params)){
            this.setQueryParam(name, value);
        }
    }
    setQueryParam(name, value) {
        if (value === undefined || value === null) {
            return;
        }
        if (typeof value === "string") {
            this.queryParams[name] = value;
        } else if (typeof value === "boolean" || typeof value === "number") {
            this.queryParams[name] = value.toString();
        } else if (value instanceof Date) {
            this.queryParams[name] = value.toISOString();
        } else if (Array.isArray(value)) {
            if (value.length > 0) {
                this.queryParams[name] = value.join(",");
            }
        } else {
            const _assert_unreachable = value;
            throw new Error(`query parameter ${name} has unsupported type`);
        }
    }
    setHeaderParam(name, value) {
        if (value === undefined) {
            return;
        }
        this.headerParams[name] = value;
    }
    setBody(value) {
        this.body = JSON.stringify(value);
    }
    send(ctx, parseResponseBody) {
        return __awaiter(this, void 0, void 0, function*() {
            const response = yield this.sendInner(ctx);
            if (response.status === 204) {
                return null;
            }
            const responseBody = yield response.text();
            return parseResponseBody(JSON.parse(responseBody));
        });
    }
    sendNoResponseBody(ctx) {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.sendInner(ctx);
        });
    }
    sendInner(ctx) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function*() {
            const url = new URL(ctx.baseUrl + this.path);
            for (const [name, value] of Object.entries(this.queryParams)){
                url.searchParams.set(name, value);
            }
            if (this.headerParams["idempotency-key"] === undefined && this.method.toUpperCase() === "POST") {
                this.headerParams["idempotency-key"] = `auto_${(0, uuid_1.v4)()}`;
            }
            const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            if (this.body != null) {
                this.headerParams["content-type"] = "application/json";
            }
            const isCredentialsSupported = "credentials" in Request.prototype;
            const response = yield sendWithRetry(url, {
                method: this.method.toString(),
                body: this.body,
                headers: Object.assign({
                    accept: "application/json, */*;q=0.8",
                    authorization: `Bearer ${ctx.token}`,
                    "user-agent": USER_AGENT,
                    "svix-req-id": randomId.toString()
                }, this.headerParams),
                credentials: isCredentialsSupported ? "same-origin" : undefined,
                signal: ctx.timeout !== undefined ? AbortSignal.timeout(ctx.timeout) : undefined
            }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === void 0 ? void 0 : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === void 0 ? void 0 : _b.length) || ctx.numRetries, ctx.fetch);
            return filterResponseForErrors(response);
        });
    }
}
exports.SvixRequest = SvixRequest;
function filterResponseForErrors(response) {
    return __awaiter(this, void 0, void 0, function*() {
        if (response.status < 300) {
            return response;
        }
        const responseBody = yield response.text();
        if (response.status === 422) {
            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        if (response.status >= 400 && response.status <= 499) {
            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        throw new util_1.ApiException(response.status, responseBody, response.headers);
    });
}
function sendWithRetry(url, init, retryScheduleInMs, nextInterval = 50, triesLeft = 2, fetchImpl = fetch, retryCount = 1) {
    return __awaiter(this, void 0, void 0, function*() {
        const sleep = (interval)=>new Promise((resolve)=>setTimeout(resolve, interval));
        try {
            const response = yield fetchImpl(url, init);
            if (triesLeft <= 0 || response.status < 500) {
                return response;
            }
        } catch (e) {
            if (triesLeft <= 0) {
                throw e;
            }
        }
        yield sleep(nextInterval);
        init.headers["svix-retry-count"] = retryCount.toString();
        nextInterval = (retryScheduleInMs === null || retryScheduleInMs === void 0 ? void 0 : retryScheduleInMs[retryCount]) || nextInterval * 2;
        return yield sendWithRetry(url, init, retryScheduleInMs, nextInterval, --triesLeft, fetchImpl, ++retryCount);
    });
} //# sourceMappingURL=request.js.map
}),
"[project]/node_modules/svix/dist/api/application.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Application = void 0;
const applicationIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationIn.js [app-rsc] (ecmascript)");
const applicationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationOut.js [app-rsc] (ecmascript)");
const applicationPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationPatch.js [app-rsc] (ecmascript)");
const listResponseApplicationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseApplicationOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Application {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app");
        request.setQueryParams({
            exclude_apps_with_no_endpoints: options === null || options === void 0 ? void 0 : options.excludeAppsWithNoEndpoints,
            exclude_apps_with_disabled_endpoints: options === null || options === void 0 ? void 0 : options.excludeAppsWithDisabledEndpoints,
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseApplicationOut_1.ListResponseApplicationOutSerializer._fromJsonObject);
    }
    create(applicationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    getOrCreate(applicationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
        request.setQueryParam("get_if_exists", true);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    get(appId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    update(appId, applicationIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        request.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    delete(appId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, applicationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}");
        request.setPathParam("app_id", appId);
        request.setBody(applicationPatch_1.ApplicationPatchSerializer._toJsonObject(applicationPatch));
        return request.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
}
exports.Application = Application; //# sourceMappingURL=application.js.map
}),
"[project]/node_modules/svix/dist/models/apiTokenOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApiTokenOutSerializer = void 0;
exports.ApiTokenOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            expiresAt: object["expiresAt"] ? new Date(object["expiresAt"]) : null,
            id: object["id"],
            name: object["name"],
            scopes: object["scopes"],
            token: object["token"]
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            expiresAt: self.expiresAt,
            id: self.id,
            name: self.name,
            scopes: self.scopes,
            token: self.token
        };
    }
}; //# sourceMappingURL=apiTokenOut.js.map
}),
"[project]/node_modules/svix/dist/models/appPortalCapability.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppPortalCapabilitySerializer = exports.AppPortalCapability = void 0;
var AppPortalCapability;
(function(AppPortalCapability) {
    AppPortalCapability["ViewBase"] = "ViewBase";
    AppPortalCapability["ViewEndpointSecret"] = "ViewEndpointSecret";
    AppPortalCapability["ManageEndpointSecret"] = "ManageEndpointSecret";
    AppPortalCapability["ManageTransformations"] = "ManageTransformations";
    AppPortalCapability["CreateAttempts"] = "CreateAttempts";
    AppPortalCapability["ManageEndpoint"] = "ManageEndpoint";
})(AppPortalCapability = exports.AppPortalCapability || (exports.AppPortalCapability = {}));
exports.AppPortalCapabilitySerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=appPortalCapability.js.map
}),
"[project]/node_modules/svix/dist/models/appPortalAccessIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppPortalAccessInSerializer = void 0;
const appPortalCapability_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appPortalCapability.js [app-rsc] (ecmascript)");
const applicationIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationIn.js [app-rsc] (ecmascript)");
exports.AppPortalAccessInSerializer = {
    _fromJsonObject (object) {
        var _a;
        return {
            application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : undefined,
            capabilities: (_a = object["capabilities"]) === null || _a === void 0 ? void 0 : _a.map((item)=>appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
            expiry: object["expiry"],
            featureFlags: object["featureFlags"],
            readOnly: object["readOnly"],
            sessionId: object["sessionId"]
        };
    },
    _toJsonObject (self) {
        var _a;
        return {
            application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : undefined,
            capabilities: (_a = self.capabilities) === null || _a === void 0 ? void 0 : _a.map((item)=>appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
            expiry: self.expiry,
            featureFlags: self.featureFlags,
            readOnly: self.readOnly,
            sessionId: self.sessionId
        };
    }
}; //# sourceMappingURL=appPortalAccessIn.js.map
}),
"[project]/node_modules/svix/dist/models/appPortalAccessOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppPortalAccessOutSerializer = void 0;
exports.AppPortalAccessOutSerializer = {
    _fromJsonObject (object) {
        return {
            token: object["token"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            token: self.token,
            url: self.url
        };
    }
}; //# sourceMappingURL=appPortalAccessOut.js.map
}),
"[project]/node_modules/svix/dist/models/applicationTokenExpireIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ApplicationTokenExpireInSerializer = void 0;
exports.ApplicationTokenExpireInSerializer = {
    _fromJsonObject (object) {
        return {
            expiry: object["expiry"],
            sessionIds: object["sessionIds"]
        };
    },
    _toJsonObject (self) {
        return {
            expiry: self.expiry,
            sessionIds: self.sessionIds
        };
    }
}; //# sourceMappingURL=applicationTokenExpireIn.js.map
}),
"[project]/node_modules/svix/dist/models/rotatePollerTokenIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RotatePollerTokenInSerializer = void 0;
exports.RotatePollerTokenInSerializer = {
    _fromJsonObject (object) {
        return {
            expiry: object["expiry"],
            oldTokenExpiry: object["oldTokenExpiry"]
        };
    },
    _toJsonObject (self) {
        return {
            expiry: self.expiry,
            oldTokenExpiry: self.oldTokenExpiry
        };
    }
}; //# sourceMappingURL=rotatePollerTokenIn.js.map
}),
"[project]/node_modules/svix/dist/models/streamPortalAccessIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamPortalAccessInSerializer = void 0;
exports.StreamPortalAccessInSerializer = {
    _fromJsonObject (object) {
        return {
            expiry: object["expiry"],
            featureFlags: object["featureFlags"],
            sessionId: object["sessionId"]
        };
    },
    _toJsonObject (self) {
        return {
            expiry: self.expiry,
            featureFlags: self.featureFlags,
            sessionId: self.sessionId
        };
    }
}; //# sourceMappingURL=streamPortalAccessIn.js.map
}),
"[project]/node_modules/svix/dist/models/dashboardAccessOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DashboardAccessOutSerializer = void 0;
exports.DashboardAccessOutSerializer = {
    _fromJsonObject (object) {
        return {
            token: object["token"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            token: self.token,
            url: self.url
        };
    }
}; //# sourceMappingURL=dashboardAccessOut.js.map
}),
"[project]/node_modules/svix/dist/api/authentication.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Authentication = void 0;
const apiTokenOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/apiTokenOut.js [app-rsc] (ecmascript)");
const appPortalAccessIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appPortalAccessIn.js [app-rsc] (ecmascript)");
const appPortalAccessOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appPortalAccessOut.js [app-rsc] (ecmascript)");
const applicationTokenExpireIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationTokenExpireIn.js [app-rsc] (ecmascript)");
const rotatePollerTokenIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/rotatePollerTokenIn.js [app-rsc] (ecmascript)");
const streamPortalAccessIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamPortalAccessIn.js [app-rsc] (ecmascript)");
const dashboardAccessOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/dashboardAccessOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Authentication {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    appPortalAccess(appId, appPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app-portal-access/{app_id}");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(appPortalAccessIn_1.AppPortalAccessInSerializer._toJsonObject(appPortalAccessIn));
        return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
    }
    expireAll(appId, applicationTokenExpireIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app/{app_id}/expire-all");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(applicationTokenExpireIn_1.ApplicationTokenExpireInSerializer._toJsonObject(applicationTokenExpireIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    dashboardAccess(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/dashboard-access/{app_id}");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
    logout(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/logout");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.sendNoResponseBody(this.requestCtx);
    }
    streamPortalAccess(streamId, streamPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream-portal-access/{stream_id}");
        request.setPathParam("stream_id", streamId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamPortalAccessIn_1.StreamPortalAccessInSerializer._toJsonObject(streamPortalAccessIn));
        return request.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
    }
    getStreamPollerToken(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
    }
    rotateStreamPollerToken(streamId, sinkId, rotatePollerTokenIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/stream/{stream_id}/sink/{sink_id}/poller/token/rotate");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(rotatePollerTokenIn_1.RotatePollerTokenInSerializer._toJsonObject(rotatePollerTokenIn));
        return request.send(this.requestCtx, apiTokenOut_1.ApiTokenOutSerializer._fromJsonObject);
    }
}
exports.Authentication = Authentication; //# sourceMappingURL=authentication.js.map
}),
"[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BackgroundTaskStatusSerializer = exports.BackgroundTaskStatus = void 0;
var BackgroundTaskStatus;
(function(BackgroundTaskStatus) {
    BackgroundTaskStatus["Running"] = "running";
    BackgroundTaskStatus["Finished"] = "finished";
    BackgroundTaskStatus["Failed"] = "failed";
})(BackgroundTaskStatus = exports.BackgroundTaskStatus || (exports.BackgroundTaskStatus = {}));
exports.BackgroundTaskStatusSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=backgroundTaskStatus.js.map
}),
"[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BackgroundTaskTypeSerializer = exports.BackgroundTaskType = void 0;
var BackgroundTaskType;
(function(BackgroundTaskType) {
    BackgroundTaskType["EndpointReplay"] = "endpoint.replay";
    BackgroundTaskType["EndpointRecover"] = "endpoint.recover";
    BackgroundTaskType["ApplicationStats"] = "application.stats";
    BackgroundTaskType["MessageBroadcast"] = "message.broadcast";
    BackgroundTaskType["SdkGenerate"] = "sdk.generate";
    BackgroundTaskType["EventTypeAggregate"] = "event-type.aggregate";
    BackgroundTaskType["ApplicationPurgeContent"] = "application.purge_content";
    BackgroundTaskType["EndpointBulkReplay"] = "endpoint.bulk_replay";
})(BackgroundTaskType = exports.BackgroundTaskType || (exports.BackgroundTaskType = {}));
exports.BackgroundTaskTypeSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=backgroundTaskType.js.map
}),
"[project]/node_modules/svix/dist/models/backgroundTaskOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BackgroundTaskOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.BackgroundTaskOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"],
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data,
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
    }
}; //# sourceMappingURL=backgroundTaskOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseBackgroundTaskOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseBackgroundTaskOutSerializer = void 0;
const backgroundTaskOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskOut.js [app-rsc] (ecmascript)");
exports.ListResponseBackgroundTaskOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseBackgroundTaskOut.js.map
}),
"[project]/node_modules/svix/dist/api/backgroundTask.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BackgroundTask = void 0;
const backgroundTaskOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskOut.js [app-rsc] (ecmascript)");
const listResponseBackgroundTaskOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseBackgroundTaskOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class BackgroundTask {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
        request.setQueryParams({
            status: options === null || options === void 0 ? void 0 : options.status,
            task: options === null || options === void 0 ? void 0 : options.task,
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
    }
    listByEndpoint(options) {
        return this.list(options);
    }
    get(taskId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
        request.setPathParam("task_id", taskId);
        return request.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
    }
}
exports.BackgroundTask = BackgroundTask; //# sourceMappingURL=backgroundTask.js.map
}),
"[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorKindSerializer = exports.ConnectorKind = void 0;
var ConnectorKind;
(function(ConnectorKind) {
    ConnectorKind["Custom"] = "Custom";
    ConnectorKind["AgenticCommerceProtocol"] = "AgenticCommerceProtocol";
    ConnectorKind["CloseCrm"] = "CloseCRM";
    ConnectorKind["CustomerIo"] = "CustomerIO";
    ConnectorKind["Discord"] = "Discord";
    ConnectorKind["Hubspot"] = "Hubspot";
    ConnectorKind["Inngest"] = "Inngest";
    ConnectorKind["Loops"] = "Loops";
    ConnectorKind["Otel"] = "Otel";
    ConnectorKind["Resend"] = "Resend";
    ConnectorKind["Salesforce"] = "Salesforce";
    ConnectorKind["Segment"] = "Segment";
    ConnectorKind["Sendgrid"] = "Sendgrid";
    ConnectorKind["Slack"] = "Slack";
    ConnectorKind["Teams"] = "Teams";
    ConnectorKind["TriggerDev"] = "TriggerDev";
    ConnectorKind["Windmill"] = "Windmill";
    ConnectorKind["Zapier"] = "Zapier";
})(ConnectorKind = exports.ConnectorKind || (exports.ConnectorKind = {}));
exports.ConnectorKindSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=connectorKind.js.map
}),
"[project]/node_modules/svix/dist/models/connectorProduct.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorProductSerializer = exports.ConnectorProduct = void 0;
var ConnectorProduct;
(function(ConnectorProduct) {
    ConnectorProduct["Dispatch"] = "Dispatch";
    ConnectorProduct["Stream"] = "Stream";
})(ConnectorProduct = exports.ConnectorProduct || (exports.ConnectorProduct = {}));
exports.ConnectorProductSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=connectorProduct.js.map
}),
"[project]/node_modules/svix/dist/models/connectorIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorInSerializer = void 0;
const connectorKind_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)");
const connectorProduct_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorProduct.js [app-rsc] (ecmascript)");
exports.ConnectorInSerializer = {
    _fromJsonObject (object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            instructions: object["instructions"],
            kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
            logo: object["logo"],
            name: object["name"],
            productType: object["productType"] ? connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]) : undefined,
            transformation: object["transformation"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            description: self.description,
            featureFlags: self.featureFlags,
            instructions: self.instructions,
            kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
            logo: self.logo,
            name: self.name,
            productType: self.productType ? connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType) : undefined,
            transformation: self.transformation,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=connectorIn.js.map
}),
"[project]/node_modules/svix/dist/models/connectorOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorOutSerializer = void 0;
const connectorKind_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)");
const connectorProduct_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorProduct.js [app-rsc] (ecmascript)");
exports.ConnectorOutSerializer = {
    _fromJsonObject (object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            featureFlags: object["featureFlags"],
            id: object["id"],
            instructions: object["instructions"],
            kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
            logo: object["logo"],
            name: object["name"],
            orgId: object["orgId"],
            productType: connectorProduct_1.ConnectorProductSerializer._fromJsonObject(object["productType"]),
            transformation: object["transformation"],
            transformationUpdatedAt: new Date(object["transformationUpdatedAt"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            createdAt: self.createdAt,
            description: self.description,
            featureFlags: self.featureFlags,
            id: self.id,
            instructions: self.instructions,
            kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
            logo: self.logo,
            name: self.name,
            orgId: self.orgId,
            productType: connectorProduct_1.ConnectorProductSerializer._toJsonObject(self.productType),
            transformation: self.transformation,
            transformationUpdatedAt: self.transformationUpdatedAt,
            uid: self.uid,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=connectorOut.js.map
}),
"[project]/node_modules/svix/dist/models/connectorPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorPatchSerializer = void 0;
const connectorKind_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)");
exports.ConnectorPatchSerializer = {
    _fromJsonObject (object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            instructions: object["instructions"],
            kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
            logo: object["logo"],
            name: object["name"],
            transformation: object["transformation"]
        };
    },
    _toJsonObject (self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            description: self.description,
            featureFlags: self.featureFlags,
            instructions: self.instructions,
            kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
            logo: self.logo,
            name: self.name,
            transformation: self.transformation
        };
    }
}; //# sourceMappingURL=connectorPatch.js.map
}),
"[project]/node_modules/svix/dist/models/connectorUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConnectorUpdateSerializer = void 0;
const connectorKind_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)");
exports.ConnectorUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            allowedEventTypes: object["allowedEventTypes"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            instructions: object["instructions"],
            kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : undefined,
            logo: object["logo"],
            name: object["name"],
            transformation: object["transformation"]
        };
    },
    _toJsonObject (self) {
        return {
            allowedEventTypes: self.allowedEventTypes,
            description: self.description,
            featureFlags: self.featureFlags,
            instructions: self.instructions,
            kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
            logo: self.logo,
            name: self.name,
            transformation: self.transformation
        };
    }
}; //# sourceMappingURL=connectorUpdate.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseConnectorOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseConnectorOutSerializer = void 0;
const connectorOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorOut.js [app-rsc] (ecmascript)");
exports.ListResponseConnectorOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseConnectorOut.js.map
}),
"[project]/node_modules/svix/dist/api/connector.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Connector = void 0;
const connectorIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorIn.js [app-rsc] (ecmascript)");
const connectorOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorOut.js [app-rsc] (ecmascript)");
const connectorPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorPatch.js [app-rsc] (ecmascript)");
const connectorUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorUpdate.js [app-rsc] (ecmascript)");
const listResponseConnectorOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseConnectorOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Connector {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
            product_type: options === null || options === void 0 ? void 0 : options.productType
        });
        return request.send(this.requestCtx, listResponseConnectorOut_1.ListResponseConnectorOutSerializer._fromJsonObject);
    }
    create(connectorIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/connector");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(connectorIn_1.ConnectorInSerializer._toJsonObject(connectorIn));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    get(connectorId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    update(connectorId, connectorUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        request.setBody(connectorUpdate_1.ConnectorUpdateSerializer._toJsonObject(connectorUpdate));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
    delete(connectorId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(connectorId, connectorPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/connector/{connector_id}");
        request.setPathParam("connector_id", connectorId);
        request.setBody(connectorPatch_1.ConnectorPatchSerializer._toJsonObject(connectorPatch));
        return request.send(this.requestCtx, connectorOut_1.ConnectorOutSerializer._fromJsonObject);
    }
}
exports.Connector = Connector; //# sourceMappingURL=connector.js.map
}),
"[project]/node_modules/svix/dist/models/endpointHeadersIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointHeadersInSerializer = void 0;
exports.EndpointHeadersInSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers
        };
    }
}; //# sourceMappingURL=endpointHeadersIn.js.map
}),
"[project]/node_modules/svix/dist/models/endpointHeadersOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointHeadersOutSerializer = void 0;
exports.EndpointHeadersOutSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"],
            sensitive: object["sensitive"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers,
            sensitive: self.sensitive
        };
    }
}; //# sourceMappingURL=endpointHeadersOut.js.map
}),
"[project]/node_modules/svix/dist/models/endpointHeadersPatchIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointHeadersPatchInSerializer = void 0;
exports.EndpointHeadersPatchInSerializer = {
    _fromJsonObject (object) {
        return {
            deleteHeaders: object["deleteHeaders"],
            headers: object["headers"]
        };
    },
    _toJsonObject (self) {
        return {
            deleteHeaders: self.deleteHeaders,
            headers: self.headers
        };
    }
}; //# sourceMappingURL=endpointHeadersPatchIn.js.map
}),
"[project]/node_modules/svix/dist/models/endpointIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointInSerializer = void 0;
exports.EndpointInSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            headers: object["headers"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
            uid: object["uid"],
            url: object["url"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            headers: self.headers,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url,
            version: self.version
        };
    }
}; //# sourceMappingURL=endpointIn.js.map
}),
"[project]/node_modules/svix/dist/models/endpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointOutSerializer = void 0;
exports.EndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            id: self.id,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url,
            version: self.version
        };
    }
}; //# sourceMappingURL=endpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/endpointPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointPatchSerializer = void 0;
exports.EndpointPatchSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
            uid: object["uid"],
            url: object["url"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url,
            version: self.version
        };
    }
}; //# sourceMappingURL=endpointPatch.js.map
}),
"[project]/node_modules/svix/dist/models/endpointSecretOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointSecretOutSerializer = void 0;
exports.EndpointSecretOutSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=endpointSecretOut.js.map
}),
"[project]/node_modules/svix/dist/models/endpointSecretRotateIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointSecretRotateInSerializer = void 0;
exports.EndpointSecretRotateInSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=endpointSecretRotateIn.js.map
}),
"[project]/node_modules/svix/dist/models/endpointStats.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointStatsSerializer = void 0;
exports.EndpointStatsSerializer = {
    _fromJsonObject (object) {
        return {
            fail: object["fail"],
            pending: object["pending"],
            sending: object["sending"],
            success: object["success"]
        };
    },
    _toJsonObject (self) {
        return {
            fail: self.fail,
            pending: self.pending,
            sending: self.sending,
            success: self.success
        };
    }
}; //# sourceMappingURL=endpointStats.js.map
}),
"[project]/node_modules/svix/dist/models/endpointTransformationIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointTransformationInSerializer = void 0;
exports.EndpointTransformationInSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled
        };
    }
}; //# sourceMappingURL=endpointTransformationIn.js.map
}),
"[project]/node_modules/svix/dist/models/endpointTransformationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointTransformationOutSerializer = void 0;
exports.EndpointTransformationOutSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"],
            updatedAt: object["updatedAt"] ? new Date(object["updatedAt"]) : null
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=endpointTransformationOut.js.map
}),
"[project]/node_modules/svix/dist/models/endpointTransformationPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointTransformationPatchSerializer = void 0;
exports.EndpointTransformationPatchSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled
        };
    }
}; //# sourceMappingURL=endpointTransformationPatch.js.map
}),
"[project]/node_modules/svix/dist/models/endpointUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointUpdateSerializer = void 0;
exports.EndpointUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            url: object["url"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            url: self.url,
            version: self.version
        };
    }
}; //# sourceMappingURL=endpointUpdate.js.map
}),
"[project]/node_modules/svix/dist/models/eventExampleIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventExampleInSerializer = void 0;
exports.EventExampleInSerializer = {
    _fromJsonObject (object) {
        return {
            eventType: object["eventType"],
            exampleIndex: object["exampleIndex"]
        };
    },
    _toJsonObject (self) {
        return {
            eventType: self.eventType,
            exampleIndex: self.exampleIndex
        };
    }
}; //# sourceMappingURL=eventExampleIn.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseEndpointOutSerializer = void 0;
const endpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointOut.js [app-rsc] (ecmascript)");
exports.ListResponseEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>endpointOut_1.EndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>endpointOut_1.EndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/messageOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageOutSerializer = void 0;
exports.MessageOutSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
            eventId: object["eventId"],
            eventType: object["eventType"],
            id: object["id"],
            payload: object["payload"],
            tags: object["tags"],
            timestamp: new Date(object["timestamp"])
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            deliverAt: self.deliverAt,
            eventId: self.eventId,
            eventType: self.eventType,
            id: self.id,
            payload: self.payload,
            tags: self.tags,
            timestamp: self.timestamp
        };
    }
}; //# sourceMappingURL=messageOut.js.map
}),
"[project]/node_modules/svix/dist/models/recoverIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecoverInSerializer = void 0;
exports.RecoverInSerializer = {
    _fromJsonObject (object) {
        return {
            since: new Date(object["since"]),
            until: object["until"] ? new Date(object["until"]) : null
        };
    },
    _toJsonObject (self) {
        return {
            since: self.since,
            until: self.until
        };
    }
}; //# sourceMappingURL=recoverIn.js.map
}),
"[project]/node_modules/svix/dist/models/recoverOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecoverOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.RecoverOutSerializer = {
    _fromJsonObject (object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
    },
    _toJsonObject (self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
    }
}; //# sourceMappingURL=recoverOut.js.map
}),
"[project]/node_modules/svix/dist/models/replayIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ReplayInSerializer = void 0;
exports.ReplayInSerializer = {
    _fromJsonObject (object) {
        return {
            since: new Date(object["since"]),
            until: object["until"] ? new Date(object["until"]) : null
        };
    },
    _toJsonObject (self) {
        return {
            since: self.since,
            until: self.until
        };
    }
}; //# sourceMappingURL=replayIn.js.map
}),
"[project]/node_modules/svix/dist/models/replayOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ReplayOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.ReplayOutSerializer = {
    _fromJsonObject (object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
    },
    _toJsonObject (self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
    }
}; //# sourceMappingURL=replayOut.js.map
}),
"[project]/node_modules/svix/dist/api/endpoint.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Endpoint = void 0;
const endpointHeadersIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointHeadersIn.js [app-rsc] (ecmascript)");
const endpointHeadersOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointHeadersOut.js [app-rsc] (ecmascript)");
const endpointHeadersPatchIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointHeadersPatchIn.js [app-rsc] (ecmascript)");
const endpointIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointIn.js [app-rsc] (ecmascript)");
const endpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointOut.js [app-rsc] (ecmascript)");
const endpointPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointPatch.js [app-rsc] (ecmascript)");
const endpointSecretOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointSecretOut.js [app-rsc] (ecmascript)");
const endpointSecretRotateIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointSecretRotateIn.js [app-rsc] (ecmascript)");
const endpointStats_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointStats.js [app-rsc] (ecmascript)");
const endpointTransformationIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointTransformationIn.js [app-rsc] (ecmascript)");
const endpointTransformationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointTransformationOut.js [app-rsc] (ecmascript)");
const endpointTransformationPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointTransformationPatch.js [app-rsc] (ecmascript)");
const endpointUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointUpdate.js [app-rsc] (ecmascript)");
const eventExampleIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventExampleIn.js [app-rsc] (ecmascript)");
const listResponseEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseEndpointOut.js [app-rsc] (ecmascript)");
const messageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageOut.js [app-rsc] (ecmascript)");
const recoverIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/recoverIn.js [app-rsc] (ecmascript)");
const recoverOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/recoverOut.js [app-rsc] (ecmascript)");
const replayIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/replayIn.js [app-rsc] (ecmascript)");
const replayOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/replayOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Endpoint {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseEndpointOut_1.ListResponseEndpointOutSerializer._fromJsonObject);
    }
    create(appId, endpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(endpointIn_1.EndpointInSerializer._toJsonObject(endpointIn));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    get(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    update(appId, endpointId, endpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointUpdate_1.EndpointUpdateSerializer._toJsonObject(endpointUpdate));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    delete(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, endpointId, endpointPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointPatch_1.EndpointPatchSerializer._toJsonObject(endpointPatch));
        return request.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    getHeaders(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(appId, endpointId, endpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointHeadersIn_1.EndpointHeadersInSerializer._toJsonObject(endpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    headersUpdate(appId, endpointId, endpointHeadersIn) {
        return this.updateHeaders(appId, endpointId, endpointHeadersIn);
    }
    patchHeaders(appId, endpointId, endpointHeadersPatchIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointHeadersPatchIn_1.EndpointHeadersPatchInSerializer._toJsonObject(endpointHeadersPatchIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    headersPatch(appId, endpointId, endpointHeadersPatchIn) {
        return this.patchHeaders(appId, endpointId, endpointHeadersPatchIn);
    }
    recover(appId, endpointId, recoverIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(recoverIn_1.RecoverInSerializer._toJsonObject(recoverIn));
        return request.send(this.requestCtx, recoverOut_1.RecoverOutSerializer._fromJsonObject);
    }
    replayMissing(appId, endpointId, replayIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/replay-missing");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(replayIn_1.ReplayInSerializer._toJsonObject(replayIn));
        return request.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
    }
    getSecret(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointSecretOut_1.EndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(appId, endpointId, endpointSecretRotateIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    sendExample(appId, endpointId, eventExampleIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventExampleIn_1.EventExampleInSerializer._toJsonObject(eventExampleIn));
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    getStats(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParams({
            since: options === null || options === void 0 ? void 0 : options.since,
            until: options === null || options === void 0 ? void 0 : options.until
        });
        return request.send(this.requestCtx, endpointStats_1.EndpointStatsSerializer._fromJsonObject);
    }
    transformationGet(appId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, endpointTransformationOut_1.EndpointTransformationOutSerializer._fromJsonObject);
    }
    patchTransformation(appId, endpointId, endpointTransformationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointTransformationPatch_1.EndpointTransformationPatchSerializer._toJsonObject(endpointTransformationPatch));
        return request.sendNoResponseBody(this.requestCtx);
    }
    transformationPartialUpdate(appId, endpointId, endpointTransformationIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(endpointTransformationIn_1.EndpointTransformationInSerializer._toJsonObject(endpointTransformationIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Endpoint = Endpoint; //# sourceMappingURL=endpoint.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeInSerializer = void 0;
exports.EventTypeInSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            name: object["name"],
            schemas: object["schemas"]
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            name: self.name,
            schemas: self.schemas
        };
    }
}; //# sourceMappingURL=eventTypeIn.js.map
}),
"[project]/node_modules/svix/dist/models/environmentIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EnvironmentInSerializer = void 0;
const connectorIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorIn.js [app-rsc] (ecmascript)");
const eventTypeIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeIn.js [app-rsc] (ecmascript)");
exports.EnvironmentInSerializer = {
    _fromJsonObject (object) {
        var _a, _b;
        return {
            connectors: (_a = object["connectors"]) === null || _a === void 0 ? void 0 : _a.map((item)=>connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
            eventTypes: (_b = object["eventTypes"]) === null || _b === void 0 ? void 0 : _b.map((item)=>eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
            settings: object["settings"]
        };
    },
    _toJsonObject (self) {
        var _a, _b;
        return {
            connectors: (_a = self.connectors) === null || _a === void 0 ? void 0 : _a.map((item)=>connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
            eventTypes: (_b = self.eventTypes) === null || _b === void 0 ? void 0 : _b.map((item)=>eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
            settings: self.settings
        };
    }
}; //# sourceMappingURL=environmentIn.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeOutSerializer = void 0;
exports.EventTypeOutSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            createdAt: new Date(object["createdAt"]),
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            name: object["name"],
            schemas: object["schemas"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            createdAt: self.createdAt,
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            name: self.name,
            schemas: self.schemas,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=eventTypeOut.js.map
}),
"[project]/node_modules/svix/dist/models/environmentOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EnvironmentOutSerializer = void 0;
const connectorOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorOut.js [app-rsc] (ecmascript)");
const eventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeOut.js [app-rsc] (ecmascript)");
exports.EnvironmentOutSerializer = {
    _fromJsonObject (object) {
        return {
            connectors: object["connectors"].map((item)=>connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
            createdAt: new Date(object["createdAt"]),
            eventTypes: object["eventTypes"].map((item)=>eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
            settings: object["settings"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            connectors: self.connectors.map((item)=>connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
            createdAt: self.createdAt,
            eventTypes: self.eventTypes.map((item)=>eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
            settings: self.settings,
            version: self.version
        };
    }
}; //# sourceMappingURL=environmentOut.js.map
}),
"[project]/node_modules/svix/dist/api/environment.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Environment = void 0;
const environmentIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/environmentIn.js [app-rsc] (ecmascript)");
const environmentOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/environmentOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Environment {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    export(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
    }
    import(environmentIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Environment = Environment; //# sourceMappingURL=environment.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeImportOpenApiIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeImportOpenApiInSerializer = void 0;
exports.EventTypeImportOpenApiInSerializer = {
    _fromJsonObject (object) {
        return {
            dryRun: object["dryRun"],
            replaceAll: object["replaceAll"],
            spec: object["spec"],
            specRaw: object["specRaw"]
        };
    },
    _toJsonObject (self) {
        return {
            dryRun: self.dryRun,
            replaceAll: self.replaceAll,
            spec: self.spec,
            specRaw: self.specRaw
        };
    }
}; //# sourceMappingURL=eventTypeImportOpenApiIn.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeFromOpenApi.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeFromOpenApiSerializer = void 0;
exports.EventTypeFromOpenApiSerializer = {
    _fromJsonObject (object) {
        return {
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            name: object["name"],
            schemas: object["schemas"]
        };
    },
    _toJsonObject (self) {
        return {
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            name: self.name,
            schemas: self.schemas
        };
    }
}; //# sourceMappingURL=eventTypeFromOpenApi.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeImportOpenApiOutData.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeImportOpenApiOutDataSerializer = void 0;
const eventTypeFromOpenApi_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeFromOpenApi.js [app-rsc] (ecmascript)");
exports.EventTypeImportOpenApiOutDataSerializer = {
    _fromJsonObject (object) {
        var _a;
        return {
            modified: object["modified"],
            toModify: (_a = object["to_modify"]) === null || _a === void 0 ? void 0 : _a.map((item)=>eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item))
        };
    },
    _toJsonObject (self) {
        var _a;
        return {
            modified: self.modified,
            to_modify: (_a = self.toModify) === null || _a === void 0 ? void 0 : _a.map((item)=>eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item))
        };
    }
}; //# sourceMappingURL=eventTypeImportOpenApiOutData.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeImportOpenApiOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeImportOpenApiOutSerializer = void 0;
const eventTypeImportOpenApiOutData_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeImportOpenApiOutData.js [app-rsc] (ecmascript)");
exports.EventTypeImportOpenApiOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"])
        };
    },
    _toJsonObject (self) {
        return {
            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data)
        };
    }
}; //# sourceMappingURL=eventTypeImportOpenApiOut.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypePatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypePatchSerializer = void 0;
exports.EventTypePatchSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            schemas: object["schemas"]
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            schemas: self.schemas
        };
    }
}; //# sourceMappingURL=eventTypePatch.js.map
}),
"[project]/node_modules/svix/dist/models/eventTypeUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventTypeUpdateSerializer = void 0;
exports.EventTypeUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            schemas: object["schemas"]
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            schemas: self.schemas
        };
    }
}; //# sourceMappingURL=eventTypeUpdate.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseEventTypeOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseEventTypeOutSerializer = void 0;
const eventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeOut.js [app-rsc] (ecmascript)");
exports.ListResponseEventTypeOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseEventTypeOut.js.map
}),
"[project]/node_modules/svix/dist/api/eventType.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventType = void 0;
const eventTypeImportOpenApiIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeImportOpenApiIn.js [app-rsc] (ecmascript)");
const eventTypeImportOpenApiOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeImportOpenApiOut.js [app-rsc] (ecmascript)");
const eventTypeIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeIn.js [app-rsc] (ecmascript)");
const eventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeOut.js [app-rsc] (ecmascript)");
const eventTypePatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypePatch.js [app-rsc] (ecmascript)");
const eventTypeUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventTypeUpdate.js [app-rsc] (ecmascript)");
const listResponseEventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseEventTypeOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class EventType {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
            include_archived: options === null || options === void 0 ? void 0 : options.includeArchived,
            with_content: options === null || options === void 0 ? void 0 : options.withContent
        });
        return request.send(this.requestCtx, listResponseEventTypeOut_1.ListResponseEventTypeOutSerializer._fromJsonObject);
    }
    create(eventTypeIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventTypeIn_1.EventTypeInSerializer._toJsonObject(eventTypeIn));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    importOpenapi(eventTypeImportOpenApiIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type/import/openapi");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(eventTypeImportOpenApiIn_1.EventTypeImportOpenApiInSerializer._toJsonObject(eventTypeImportOpenApiIn));
        return request.send(this.requestCtx, eventTypeImportOpenApiOut_1.EventTypeImportOpenApiOutSerializer._fromJsonObject);
    }
    get(eventTypeName) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    update(eventTypeName, eventTypeUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setBody(eventTypeUpdate_1.EventTypeUpdateSerializer._toJsonObject(eventTypeUpdate));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    delete(eventTypeName, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setQueryParams({
            expunge: options === null || options === void 0 ? void 0 : options.expunge
        });
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(eventTypeName, eventTypePatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/event-type/{event_type_name}");
        request.setPathParam("event_type_name", eventTypeName);
        request.setBody(eventTypePatch_1.EventTypePatchSerializer._toJsonObject(eventTypePatch));
        return request.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
}
exports.EventType = EventType; //# sourceMappingURL=eventType.js.map
}),
"[project]/node_modules/svix/dist/api/health.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Health = void 0;
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Health {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    get() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Health = Health; //# sourceMappingURL=health.js.map
}),
"[project]/node_modules/svix/dist/models/ingestSourceConsumerPortalAccessIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestSourceConsumerPortalAccessInSerializer = void 0;
exports.IngestSourceConsumerPortalAccessInSerializer = {
    _fromJsonObject (object) {
        return {
            expiry: object["expiry"],
            readOnly: object["readOnly"]
        };
    },
    _toJsonObject (self) {
        return {
            expiry: self.expiry,
            readOnly: self.readOnly
        };
    }
}; //# sourceMappingURL=ingestSourceConsumerPortalAccessIn.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointHeadersIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointHeadersInSerializer = void 0;
exports.IngestEndpointHeadersInSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers
        };
    }
}; //# sourceMappingURL=ingestEndpointHeadersIn.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointHeadersOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointHeadersOutSerializer = void 0;
exports.IngestEndpointHeadersOutSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"],
            sensitive: object["sensitive"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers,
            sensitive: self.sensitive
        };
    }
}; //# sourceMappingURL=ingestEndpointHeadersOut.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointInSerializer = void 0;
exports.IngestEndpointInSerializer = {
    _fromJsonObject (object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
            uid: object["uid"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            description: self.description,
            disabled: self.disabled,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url
        };
    }
}; //# sourceMappingURL=ingestEndpointIn.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointOutSerializer = void 0;
exports.IngestEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            id: object["id"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            id: self.id,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url
        };
    }
}; //# sourceMappingURL=ingestEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointSecretIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointSecretInSerializer = void 0;
exports.IngestEndpointSecretInSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=ingestEndpointSecretIn.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointSecretOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointSecretOutSerializer = void 0;
exports.IngestEndpointSecretOutSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=ingestEndpointSecretOut.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointTransformationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointTransformationOutSerializer = void 0;
exports.IngestEndpointTransformationOutSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled
        };
    }
}; //# sourceMappingURL=ingestEndpointTransformationOut.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointTransformationPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointTransformationPatchSerializer = void 0;
exports.IngestEndpointTransformationPatchSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled
        };
    }
}; //# sourceMappingURL=ingestEndpointTransformationPatch.js.map
}),
"[project]/node_modules/svix/dist/models/ingestEndpointUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpointUpdateSerializer = void 0;
exports.IngestEndpointUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            description: self.description,
            disabled: self.disabled,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            url: self.url
        };
    }
}; //# sourceMappingURL=ingestEndpointUpdate.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseIngestEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseIngestEndpointOutSerializer = void 0;
const ingestEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointOut.js [app-rsc] (ecmascript)");
exports.ListResponseIngestEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseIngestEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/api/ingestEndpoint.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestEndpoint = void 0;
const ingestEndpointHeadersIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointHeadersIn.js [app-rsc] (ecmascript)");
const ingestEndpointHeadersOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointHeadersOut.js [app-rsc] (ecmascript)");
const ingestEndpointIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointIn.js [app-rsc] (ecmascript)");
const ingestEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointOut.js [app-rsc] (ecmascript)");
const ingestEndpointSecretIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointSecretIn.js [app-rsc] (ecmascript)");
const ingestEndpointSecretOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointSecretOut.js [app-rsc] (ecmascript)");
const ingestEndpointTransformationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointTransformationOut.js [app-rsc] (ecmascript)");
const ingestEndpointTransformationPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointTransformationPatch.js [app-rsc] (ecmascript)");
const ingestEndpointUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestEndpointUpdate.js [app-rsc] (ecmascript)");
const listResponseIngestEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseIngestEndpointOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class IngestEndpoint {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(sourceId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint");
        request.setPathParam("source_id", sourceId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseIngestEndpointOut_1.ListResponseIngestEndpointOutSerializer._fromJsonObject);
    }
    create(sourceId, ingestEndpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestEndpointIn_1.IngestEndpointInSerializer._toJsonObject(ingestEndpointIn));
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    get(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    update(sourceId, endpointId, ingestEndpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointUpdate_1.IngestEndpointUpdateSerializer._toJsonObject(ingestEndpointUpdate));
        return request.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    delete(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointHeadersOut_1.IngestEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(sourceId, endpointId, ingestEndpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointHeadersIn_1.IngestEndpointHeadersInSerializer._toJsonObject(ingestEndpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    getSecret(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointSecretOut_1.IngestEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(sourceId, endpointId, ingestEndpointSecretIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestEndpointSecretIn_1.IngestEndpointSecretInSerializer._toJsonObject(ingestEndpointSecretIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    getTransformation(sourceId, endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, ingestEndpointTransformationOut_1.IngestEndpointTransformationOutSerializer._fromJsonObject);
    }
    setTransformation(sourceId, endpointId, ingestEndpointTransformationPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
        request.setPathParam("source_id", sourceId);
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(ingestEndpointTransformationPatch_1.IngestEndpointTransformationPatchSerializer._toJsonObject(ingestEndpointTransformationPatch));
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.IngestEndpoint = IngestEndpoint; //# sourceMappingURL=ingestEndpoint.js.map
}),
"[project]/node_modules/svix/dist/models/adobeSignConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AdobeSignConfigSerializer = void 0;
exports.AdobeSignConfigSerializer = {
    _fromJsonObject (object) {
        return {
            clientId: object["clientId"]
        };
    },
    _toJsonObject (self) {
        return {
            clientId: self.clientId
        };
    }
}; //# sourceMappingURL=adobeSignConfig.js.map
}),
"[project]/node_modules/svix/dist/models/airwallexConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AirwallexConfigSerializer = void 0;
exports.AirwallexConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=airwallexConfig.js.map
}),
"[project]/node_modules/svix/dist/models/checkbookConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CheckbookConfigSerializer = void 0;
exports.CheckbookConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=checkbookConfig.js.map
}),
"[project]/node_modules/svix/dist/models/cronConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronConfigSerializer = void 0;
exports.CronConfigSerializer = {
    _fromJsonObject (object) {
        return {
            contentType: object["contentType"],
            payload: object["payload"],
            schedule: object["schedule"]
        };
    },
    _toJsonObject (self) {
        return {
            contentType: self.contentType,
            payload: self.payload,
            schedule: self.schedule
        };
    }
}; //# sourceMappingURL=cronConfig.js.map
}),
"[project]/node_modules/svix/dist/models/docusignConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DocusignConfigSerializer = void 0;
exports.DocusignConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=docusignConfig.js.map
}),
"[project]/node_modules/svix/dist/models/easypostConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EasypostConfigSerializer = void 0;
exports.EasypostConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=easypostConfig.js.map
}),
"[project]/node_modules/svix/dist/models/githubConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GithubConfigSerializer = void 0;
exports.GithubConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=githubConfig.js.map
}),
"[project]/node_modules/svix/dist/models/hubspotConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HubspotConfigSerializer = void 0;
exports.HubspotConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=hubspotConfig.js.map
}),
"[project]/node_modules/svix/dist/models/orumIoConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OrumIoConfigSerializer = void 0;
exports.OrumIoConfigSerializer = {
    _fromJsonObject (object) {
        return {
            publicKey: object["publicKey"]
        };
    },
    _toJsonObject (self) {
        return {
            publicKey: self.publicKey
        };
    }
}; //# sourceMappingURL=orumIoConfig.js.map
}),
"[project]/node_modules/svix/dist/models/pandaDocConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PandaDocConfigSerializer = void 0;
exports.PandaDocConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=pandaDocConfig.js.map
}),
"[project]/node_modules/svix/dist/models/portIoConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PortIoConfigSerializer = void 0;
exports.PortIoConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=portIoConfig.js.map
}),
"[project]/node_modules/svix/dist/models/rutterConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RutterConfigSerializer = void 0;
exports.RutterConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=rutterConfig.js.map
}),
"[project]/node_modules/svix/dist/models/segmentConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SegmentConfigSerializer = void 0;
exports.SegmentConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=segmentConfig.js.map
}),
"[project]/node_modules/svix/dist/models/shopifyConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ShopifyConfigSerializer = void 0;
exports.ShopifyConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=shopifyConfig.js.map
}),
"[project]/node_modules/svix/dist/models/slackConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SlackConfigSerializer = void 0;
exports.SlackConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=slackConfig.js.map
}),
"[project]/node_modules/svix/dist/models/stripeConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StripeConfigSerializer = void 0;
exports.StripeConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=stripeConfig.js.map
}),
"[project]/node_modules/svix/dist/models/svixConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SvixConfigSerializer = void 0;
exports.SvixConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=svixConfig.js.map
}),
"[project]/node_modules/svix/dist/models/telnyxConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TelnyxConfigSerializer = void 0;
exports.TelnyxConfigSerializer = {
    _fromJsonObject (object) {
        return {
            publicKey: object["publicKey"]
        };
    },
    _toJsonObject (self) {
        return {
            publicKey: self.publicKey
        };
    }
}; //# sourceMappingURL=telnyxConfig.js.map
}),
"[project]/node_modules/svix/dist/models/vapiConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VapiConfigSerializer = void 0;
exports.VapiConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=vapiConfig.js.map
}),
"[project]/node_modules/svix/dist/models/veriffConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VeriffConfigSerializer = void 0;
exports.VeriffConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=veriffConfig.js.map
}),
"[project]/node_modules/svix/dist/models/zoomConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ZoomConfigSerializer = void 0;
exports.ZoomConfigSerializer = {
    _fromJsonObject (object) {
        return {
            secret: object["secret"]
        };
    },
    _toJsonObject (self) {
        return {
            secret: self.secret
        };
    }
}; //# sourceMappingURL=zoomConfig.js.map
}),
"[project]/node_modules/svix/dist/models/ingestSourceIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestSourceInSerializer = void 0;
const adobeSignConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/adobeSignConfig.js [app-rsc] (ecmascript)");
const airwallexConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/airwallexConfig.js [app-rsc] (ecmascript)");
const checkbookConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/checkbookConfig.js [app-rsc] (ecmascript)");
const cronConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/cronConfig.js [app-rsc] (ecmascript)");
const docusignConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/docusignConfig.js [app-rsc] (ecmascript)");
const easypostConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/easypostConfig.js [app-rsc] (ecmascript)");
const githubConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/githubConfig.js [app-rsc] (ecmascript)");
const hubspotConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/hubspotConfig.js [app-rsc] (ecmascript)");
const orumIoConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/orumIoConfig.js [app-rsc] (ecmascript)");
const pandaDocConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pandaDocConfig.js [app-rsc] (ecmascript)");
const portIoConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/portIoConfig.js [app-rsc] (ecmascript)");
const rutterConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/rutterConfig.js [app-rsc] (ecmascript)");
const segmentConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/segmentConfig.js [app-rsc] (ecmascript)");
const shopifyConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/shopifyConfig.js [app-rsc] (ecmascript)");
const slackConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/slackConfig.js [app-rsc] (ecmascript)");
const stripeConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/stripeConfig.js [app-rsc] (ecmascript)");
const svixConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/svixConfig.js [app-rsc] (ecmascript)");
const telnyxConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/telnyxConfig.js [app-rsc] (ecmascript)");
const vapiConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/vapiConfig.js [app-rsc] (ecmascript)");
const veriffConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/veriffConfig.js [app-rsc] (ecmascript)");
const zoomConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/zoomConfig.js [app-rsc] (ecmascript)");
exports.IngestSourceInSerializer = {
    _fromJsonObject (object) {
        const type = object["type"];
        function getConfig(type) {
            switch(type){
                case "generic-webhook":
                    return {};
                case "cron":
                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
                case "adobe-sign":
                    return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
                case "beehiiv":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "brex":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "checkbook":
                    return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
                case "clerk":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "docusign":
                    return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
                case "easypost":
                    return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
                case "github":
                    return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
                case "guesty":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "hubspot":
                    return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
                case "incident-io":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "lithic":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "nash":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "orum-io":
                    return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
                case "panda-doc":
                    return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
                case "port-io":
                    return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
                case "pleo":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "replicate":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "resend":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "rutter":
                    return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
                case "safebase":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "sardine":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "segment":
                    return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
                case "shopify":
                    return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
                case "slack":
                    return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
                case "stripe":
                    return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
                case "stych":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "svix":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "zoom":
                    return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
                case "telnyx":
                    return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
                case "vapi":
                    return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
                case "open-ai":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "render":
                    return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
                case "veriff":
                    return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
                case "airwallex":
                    return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        let config;
        switch(self.type){
            case "generic-webhook":
                config = {};
                break;
            case "cron":
                config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
                break;
            case "adobe-sign":
                config = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
                break;
            case "beehiiv":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "brex":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "checkbook":
                config = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
                break;
            case "clerk":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "docusign":
                config = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
                break;
            case "easypost":
                config = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
                break;
            case "github":
                config = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
                break;
            case "guesty":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "hubspot":
                config = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
                break;
            case "incident-io":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "lithic":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "nash":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "orum-io":
                config = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
                break;
            case "panda-doc":
                config = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
                break;
            case "port-io":
                config = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
                break;
            case "pleo":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "replicate":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "resend":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "rutter":
                config = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
                break;
            case "safebase":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "sardine":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "segment":
                config = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
                break;
            case "shopify":
                config = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
                break;
            case "slack":
                config = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
                break;
            case "stripe":
                config = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
                break;
            case "stych":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "svix":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "zoom":
                config = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
                break;
            case "telnyx":
                config = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
                break;
            case "vapi":
                config = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
                break;
            case "open-ai":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "render":
                config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
                break;
            case "veriff":
                config = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
                break;
            case "airwallex":
                config = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            metadata: self.metadata,
            name: self.name,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=ingestSourceIn.js.map
}),
"[project]/node_modules/svix/dist/models/adobeSignConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AdobeSignConfigOutSerializer = void 0;
exports.AdobeSignConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=adobeSignConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/airwallexConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AirwallexConfigOutSerializer = void 0;
exports.AirwallexConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=airwallexConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/checkbookConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CheckbookConfigOutSerializer = void 0;
exports.CheckbookConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=checkbookConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/docusignConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DocusignConfigOutSerializer = void 0;
exports.DocusignConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=docusignConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/easypostConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EasypostConfigOutSerializer = void 0;
exports.EasypostConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=easypostConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/githubConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GithubConfigOutSerializer = void 0;
exports.GithubConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=githubConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/hubspotConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HubspotConfigOutSerializer = void 0;
exports.HubspotConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=hubspotConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/orumIoConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OrumIoConfigOutSerializer = void 0;
exports.OrumIoConfigOutSerializer = {
    _fromJsonObject (object) {
        return {
            publicKey: object["publicKey"]
        };
    },
    _toJsonObject (self) {
        return {
            publicKey: self.publicKey
        };
    }
}; //# sourceMappingURL=orumIoConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/pandaDocConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PandaDocConfigOutSerializer = void 0;
exports.PandaDocConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=pandaDocConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/portIoConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PortIoConfigOutSerializer = void 0;
exports.PortIoConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=portIoConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/rutterConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RutterConfigOutSerializer = void 0;
exports.RutterConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=rutterConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/segmentConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SegmentConfigOutSerializer = void 0;
exports.SegmentConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=segmentConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/shopifyConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ShopifyConfigOutSerializer = void 0;
exports.ShopifyConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=shopifyConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/slackConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SlackConfigOutSerializer = void 0;
exports.SlackConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=slackConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/stripeConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StripeConfigOutSerializer = void 0;
exports.StripeConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=stripeConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/svixConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SvixConfigOutSerializer = void 0;
exports.SvixConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=svixConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/telnyxConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TelnyxConfigOutSerializer = void 0;
exports.TelnyxConfigOutSerializer = {
    _fromJsonObject (object) {
        return {
            publicKey: object["publicKey"]
        };
    },
    _toJsonObject (self) {
        return {
            publicKey: self.publicKey
        };
    }
}; //# sourceMappingURL=telnyxConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/vapiConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VapiConfigOutSerializer = void 0;
exports.VapiConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=vapiConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/veriffConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VeriffConfigOutSerializer = void 0;
exports.VeriffConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=veriffConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/zoomConfigOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ZoomConfigOutSerializer = void 0;
exports.ZoomConfigOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=zoomConfigOut.js.map
}),
"[project]/node_modules/svix/dist/models/ingestSourceOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestSourceOutSerializer = void 0;
const adobeSignConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/adobeSignConfigOut.js [app-rsc] (ecmascript)");
const airwallexConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/airwallexConfigOut.js [app-rsc] (ecmascript)");
const checkbookConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/checkbookConfigOut.js [app-rsc] (ecmascript)");
const cronConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/cronConfig.js [app-rsc] (ecmascript)");
const docusignConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/docusignConfigOut.js [app-rsc] (ecmascript)");
const easypostConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/easypostConfigOut.js [app-rsc] (ecmascript)");
const githubConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/githubConfigOut.js [app-rsc] (ecmascript)");
const hubspotConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/hubspotConfigOut.js [app-rsc] (ecmascript)");
const orumIoConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/orumIoConfigOut.js [app-rsc] (ecmascript)");
const pandaDocConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pandaDocConfigOut.js [app-rsc] (ecmascript)");
const portIoConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/portIoConfigOut.js [app-rsc] (ecmascript)");
const rutterConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/rutterConfigOut.js [app-rsc] (ecmascript)");
const segmentConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/segmentConfigOut.js [app-rsc] (ecmascript)");
const shopifyConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/shopifyConfigOut.js [app-rsc] (ecmascript)");
const slackConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/slackConfigOut.js [app-rsc] (ecmascript)");
const stripeConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/stripeConfigOut.js [app-rsc] (ecmascript)");
const svixConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/svixConfigOut.js [app-rsc] (ecmascript)");
const telnyxConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/telnyxConfigOut.js [app-rsc] (ecmascript)");
const vapiConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/vapiConfigOut.js [app-rsc] (ecmascript)");
const veriffConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/veriffConfigOut.js [app-rsc] (ecmascript)");
const zoomConfigOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/zoomConfigOut.js [app-rsc] (ecmascript)");
exports.IngestSourceOutSerializer = {
    _fromJsonObject (object) {
        const type = object["type"];
        function getConfig(type) {
            switch(type){
                case "generic-webhook":
                    return {};
                case "cron":
                    return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
                case "adobe-sign":
                    return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
                case "beehiiv":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "brex":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "checkbook":
                    return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
                case "clerk":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "docusign":
                    return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
                case "easypost":
                    return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
                case "github":
                    return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
                case "guesty":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "hubspot":
                    return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
                case "incident-io":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "lithic":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "nash":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "orum-io":
                    return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
                case "panda-doc":
                    return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
                case "port-io":
                    return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
                case "pleo":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "replicate":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "resend":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "rutter":
                    return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
                case "safebase":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "sardine":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "segment":
                    return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
                case "shopify":
                    return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
                case "slack":
                    return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
                case "stripe":
                    return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
                case "stych":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "svix":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "zoom":
                    return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
                case "telnyx":
                    return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
                case "vapi":
                    return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
                case "open-ai":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "render":
                    return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
                case "veriff":
                    return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
                case "airwallex":
                    return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            createdAt: new Date(object["createdAt"]),
            id: object["id"],
            ingestUrl: object["ingestUrl"],
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        let config;
        switch(self.type){
            case "generic-webhook":
                config = {};
                break;
            case "cron":
                config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
                break;
            case "adobe-sign":
                config = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
                break;
            case "beehiiv":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "brex":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "checkbook":
                config = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
                break;
            case "clerk":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "docusign":
                config = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
                break;
            case "easypost":
                config = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
                break;
            case "github":
                config = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
                break;
            case "guesty":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "hubspot":
                config = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
                break;
            case "incident-io":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "lithic":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "nash":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "orum-io":
                config = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
                break;
            case "panda-doc":
                config = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
                break;
            case "port-io":
                config = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
                break;
            case "pleo":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "replicate":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "resend":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "rutter":
                config = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
                break;
            case "safebase":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "sardine":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "segment":
                config = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
                break;
            case "shopify":
                config = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
                break;
            case "slack":
                config = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
                break;
            case "stripe":
                config = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
                break;
            case "stych":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "svix":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "zoom":
                config = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
                break;
            case "telnyx":
                config = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
                break;
            case "vapi":
                config = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
                break;
            case "open-ai":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "render":
                config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
                break;
            case "veriff":
                config = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
                break;
            case "airwallex":
                config = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            createdAt: self.createdAt,
            id: self.id,
            ingestUrl: self.ingestUrl,
            metadata: self.metadata,
            name: self.name,
            uid: self.uid,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=ingestSourceOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseIngestSourceOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseIngestSourceOutSerializer = void 0;
const ingestSourceOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestSourceOut.js [app-rsc] (ecmascript)");
exports.ListResponseIngestSourceOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseIngestSourceOut.js.map
}),
"[project]/node_modules/svix/dist/models/rotateTokenOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RotateTokenOutSerializer = void 0;
exports.RotateTokenOutSerializer = {
    _fromJsonObject (object) {
        return {
            ingestUrl: object["ingestUrl"]
        };
    },
    _toJsonObject (self) {
        return {
            ingestUrl: self.ingestUrl
        };
    }
}; //# sourceMappingURL=rotateTokenOut.js.map
}),
"[project]/node_modules/svix/dist/api/ingestSource.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IngestSource = void 0;
const ingestSourceIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestSourceIn.js [app-rsc] (ecmascript)");
const ingestSourceOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestSourceOut.js [app-rsc] (ecmascript)");
const listResponseIngestSourceOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseIngestSourceOut.js [app-rsc] (ecmascript)");
const rotateTokenOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/rotateTokenOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class IngestSource {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseIngestSourceOut_1.ListResponseIngestSourceOutSerializer._fromJsonObject);
    }
    create(ingestSourceIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    get(sourceId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    update(sourceId, ingestSourceIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        request.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn));
        return request.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    delete(sourceId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}");
        request.setPathParam("source_id", sourceId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    rotateToken(sourceId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/token/rotate");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, rotateTokenOut_1.RotateTokenOutSerializer._fromJsonObject);
    }
}
exports.IngestSource = IngestSource; //# sourceMappingURL=ingestSource.js.map
}),
"[project]/node_modules/svix/dist/api/ingest.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Ingest = void 0;
const dashboardAccessOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/dashboardAccessOut.js [app-rsc] (ecmascript)");
const ingestSourceConsumerPortalAccessIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ingestSourceConsumerPortalAccessIn.js [app-rsc] (ecmascript)");
const ingestEndpoint_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/ingestEndpoint.js [app-rsc] (ecmascript)");
const ingestSource_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/ingestSource.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Ingest {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    get endpoint() {
        return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
    }
    get source() {
        return new ingestSource_1.IngestSource(this.requestCtx);
    }
    dashboard(sourceId, ingestSourceConsumerPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn));
        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
}
exports.Ingest = Ingest; //# sourceMappingURL=ingest.js.map
}),
"[project]/node_modules/svix/dist/models/integrationIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IntegrationInSerializer = void 0;
exports.IntegrationInSerializer = {
    _fromJsonObject (object) {
        return {
            featureFlags: object["featureFlags"],
            name: object["name"]
        };
    },
    _toJsonObject (self) {
        return {
            featureFlags: self.featureFlags,
            name: self.name
        };
    }
}; //# sourceMappingURL=integrationIn.js.map
}),
"[project]/node_modules/svix/dist/models/integrationKeyOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IntegrationKeyOutSerializer = void 0;
exports.IntegrationKeyOutSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=integrationKeyOut.js.map
}),
"[project]/node_modules/svix/dist/models/integrationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IntegrationOutSerializer = void 0;
exports.IntegrationOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            featureFlags: object["featureFlags"],
            id: object["id"],
            name: object["name"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            featureFlags: self.featureFlags,
            id: self.id,
            name: self.name,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=integrationOut.js.map
}),
"[project]/node_modules/svix/dist/models/integrationUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IntegrationUpdateSerializer = void 0;
exports.IntegrationUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            featureFlags: object["featureFlags"],
            name: object["name"]
        };
    },
    _toJsonObject (self) {
        return {
            featureFlags: self.featureFlags,
            name: self.name
        };
    }
}; //# sourceMappingURL=integrationUpdate.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseIntegrationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseIntegrationOutSerializer = void 0;
const integrationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/integrationOut.js [app-rsc] (ecmascript)");
exports.ListResponseIntegrationOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseIntegrationOut.js.map
}),
"[project]/node_modules/svix/dist/api/integration.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Integration = void 0;
const integrationIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/integrationIn.js [app-rsc] (ecmascript)");
const integrationKeyOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/integrationKeyOut.js [app-rsc] (ecmascript)");
const integrationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/integrationOut.js [app-rsc] (ecmascript)");
const integrationUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/integrationUpdate.js [app-rsc] (ecmascript)");
const listResponseIntegrationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseIntegrationOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Integration {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration");
        request.setPathParam("app_id", appId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseIntegrationOut_1.ListResponseIntegrationOutSerializer._fromJsonObject);
    }
    create(appId, integrationIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(integrationIn_1.IntegrationInSerializer._toJsonObject(integrationIn));
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    get(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    update(appId, integId, integrationUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        request.setBody(integrationUpdate_1.IntegrationUpdateSerializer._toJsonObject(integrationUpdate));
        return request.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    delete(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/integration/{integ_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    getKey(appId, integId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}/key");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
    rotateKey(appId, integId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration/{integ_id}/key/rotate");
        request.setPathParam("app_id", appId);
        request.setPathParam("integ_id", integId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
}
exports.Integration = Integration; //# sourceMappingURL=integration.js.map
}),
"[project]/node_modules/svix/dist/models/expungeAllContentsOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ExpungeAllContentsOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.ExpungeAllContentsOutSerializer = {
    _fromJsonObject (object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
    },
    _toJsonObject (self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
    }
}; //# sourceMappingURL=expungeAllContentsOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseMessageOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseMessageOutSerializer = void 0;
const messageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageOut.js [app-rsc] (ecmascript)");
exports.ListResponseMessageOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>messageOut_1.MessageOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>messageOut_1.MessageOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseMessageOut.js.map
}),
"[project]/node_modules/svix/dist/models/pollingEndpointConsumerSeekIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PollingEndpointConsumerSeekInSerializer = void 0;
exports.PollingEndpointConsumerSeekInSerializer = {
    _fromJsonObject (object) {
        return {
            after: new Date(object["after"])
        };
    },
    _toJsonObject (self) {
        return {
            after: self.after
        };
    }
}; //# sourceMappingURL=pollingEndpointConsumerSeekIn.js.map
}),
"[project]/node_modules/svix/dist/models/pollingEndpointConsumerSeekOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PollingEndpointConsumerSeekOutSerializer = void 0;
exports.PollingEndpointConsumerSeekOutSerializer = {
    _fromJsonObject (object) {
        return {
            iterator: object["iterator"]
        };
    },
    _toJsonObject (self) {
        return {
            iterator: self.iterator
        };
    }
}; //# sourceMappingURL=pollingEndpointConsumerSeekOut.js.map
}),
"[project]/node_modules/svix/dist/models/pollingEndpointMessageOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PollingEndpointMessageOutSerializer = void 0;
exports.PollingEndpointMessageOutSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
            eventId: object["eventId"],
            eventType: object["eventType"],
            headers: object["headers"],
            id: object["id"],
            payload: object["payload"],
            tags: object["tags"],
            timestamp: new Date(object["timestamp"])
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            deliverAt: self.deliverAt,
            eventId: self.eventId,
            eventType: self.eventType,
            headers: self.headers,
            id: self.id,
            payload: self.payload,
            tags: self.tags,
            timestamp: self.timestamp
        };
    }
}; //# sourceMappingURL=pollingEndpointMessageOut.js.map
}),
"[project]/node_modules/svix/dist/models/pollingEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PollingEndpointOutSerializer = void 0;
const pollingEndpointMessageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pollingEndpointMessageOut.js [app-rsc] (ecmascript)");
exports.PollingEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator
        };
    }
}; //# sourceMappingURL=pollingEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/api/messagePoller.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessagePoller = void 0;
const pollingEndpointConsumerSeekIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pollingEndpointConsumerSeekIn.js [app-rsc] (ecmascript)");
const pollingEndpointConsumerSeekOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pollingEndpointConsumerSeekOut.js [app-rsc] (ecmascript)");
const pollingEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/pollingEndpointOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class MessagePoller {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    poll(appId, sinkId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            event_type: options === null || options === void 0 ? void 0 : options.eventType,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            after: options === null || options === void 0 ? void 0 : options.after
        });
        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerPoll(appId, sinkId, consumerId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setPathParam("consumer_id", consumerId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator
        });
        return request.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerSeek(appId, sinkId, consumerId, pollingEndpointConsumerSeekIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}/seek");
        request.setPathParam("app_id", appId);
        request.setPathParam("sink_id", sinkId);
        request.setPathParam("consumer_id", consumerId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(pollingEndpointConsumerSeekIn_1.PollingEndpointConsumerSeekInSerializer._toJsonObject(pollingEndpointConsumerSeekIn));
        return request.send(this.requestCtx, pollingEndpointConsumerSeekOut_1.PollingEndpointConsumerSeekOutSerializer._fromJsonObject);
    }
}
exports.MessagePoller = MessagePoller; //# sourceMappingURL=messagePoller.js.map
}),
"[project]/node_modules/svix/dist/models/messageIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageInSerializer = void 0;
const applicationIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/applicationIn.js [app-rsc] (ecmascript)");
exports.MessageInSerializer = {
    _fromJsonObject (object) {
        return {
            application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : undefined,
            channels: object["channels"],
            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
            eventId: object["eventId"],
            eventType: object["eventType"],
            payload: object["payload"],
            payloadRetentionHours: object["payloadRetentionHours"],
            payloadRetentionPeriod: object["payloadRetentionPeriod"],
            tags: object["tags"],
            transformationsParams: object["transformationsParams"]
        };
    },
    _toJsonObject (self) {
        return {
            application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : undefined,
            channels: self.channels,
            deliverAt: self.deliverAt,
            eventId: self.eventId,
            eventType: self.eventType,
            payload: self.payload,
            payloadRetentionHours: self.payloadRetentionHours,
            payloadRetentionPeriod: self.payloadRetentionPeriod,
            tags: self.tags,
            transformationsParams: self.transformationsParams
        };
    }
}; //# sourceMappingURL=messageIn.js.map
}),
"[project]/node_modules/svix/dist/api/message.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.messageInRaw = exports.Message = void 0;
const expungeAllContentsOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/expungeAllContentsOut.js [app-rsc] (ecmascript)");
const listResponseMessageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseMessageOut.js [app-rsc] (ecmascript)");
const messageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageOut.js [app-rsc] (ecmascript)");
const messagePoller_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/messagePoller.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
const messageIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageIn.js [app-rsc] (ecmascript)");
class Message {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    get poller() {
        return new messagePoller_1.MessagePoller(this.requestCtx);
    }
    list(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg");
        request.setPathParam("app_id", appId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes
        });
        return request.send(this.requestCtx, listResponseMessageOut_1.ListResponseMessageOutSerializer._fromJsonObject);
    }
    create(appId, messageIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg");
        request.setPathParam("app_id", appId);
        request.setQueryParams({
            with_content: options === null || options === void 0 ? void 0 : options.withContent
        });
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(messageIn_1.MessageInSerializer._toJsonObject(messageIn));
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeAllContents(appId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/expunge-all-contents");
        request.setPathParam("app_id", appId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, expungeAllContentsOut_1.ExpungeAllContentsOutSerializer._fromJsonObject);
    }
    get(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParams({
            with_content: options === null || options === void 0 ? void 0 : options.withContent
        });
        return request.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/content");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Message = Message;
function messageInRaw(eventType, payload, contentType) {
    const headers = contentType ? {
        "content-type": contentType
    } : undefined;
    return {
        eventType,
        payload: {},
        transformationsParams: {
            rawPayload: payload,
            headers
        }
    };
}
exports.messageInRaw = messageInRaw; //# sourceMappingURL=message.js.map
}),
"[project]/node_modules/svix/dist/models/emptyResponse.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EmptyResponseSerializer = void 0;
exports.EmptyResponseSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=emptyResponse.js.map
}),
"[project]/node_modules/svix/dist/models/messageStatus.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageStatusSerializer = exports.MessageStatus = void 0;
var MessageStatus;
(function(MessageStatus) {
    MessageStatus[MessageStatus["Success"] = 0] = "Success";
    MessageStatus[MessageStatus["Pending"] = 1] = "Pending";
    MessageStatus[MessageStatus["Fail"] = 2] = "Fail";
    MessageStatus[MessageStatus["Sending"] = 3] = "Sending";
})(MessageStatus = exports.MessageStatus || (exports.MessageStatus = {}));
exports.MessageStatusSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=messageStatus.js.map
}),
"[project]/node_modules/svix/dist/models/messageStatusText.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageStatusTextSerializer = exports.MessageStatusText = void 0;
var MessageStatusText;
(function(MessageStatusText) {
    MessageStatusText["Success"] = "success";
    MessageStatusText["Pending"] = "pending";
    MessageStatusText["Fail"] = "fail";
    MessageStatusText["Sending"] = "sending";
})(MessageStatusText = exports.MessageStatusText || (exports.MessageStatusText = {}));
exports.MessageStatusTextSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=messageStatusText.js.map
}),
"[project]/node_modules/svix/dist/models/endpointMessageOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointMessageOutSerializer = void 0;
const messageStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatus.js [app-rsc] (ecmascript)");
const messageStatusText_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatusText.js [app-rsc] (ecmascript)");
exports.EndpointMessageOutSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            deliverAt: object["deliverAt"] ? new Date(object["deliverAt"]) : null,
            eventId: object["eventId"],
            eventType: object["eventType"],
            id: object["id"],
            nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
            payload: object["payload"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
            tags: object["tags"],
            timestamp: new Date(object["timestamp"])
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            deliverAt: self.deliverAt,
            eventId: self.eventId,
            eventType: self.eventType,
            id: self.id,
            nextAttempt: self.nextAttempt,
            payload: self.payload,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
            tags: self.tags,
            timestamp: self.timestamp
        };
    }
}; //# sourceMappingURL=endpointMessageOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseEndpointMessageOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseEndpointMessageOutSerializer = void 0;
const endpointMessageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointMessageOut.js [app-rsc] (ecmascript)");
exports.ListResponseEndpointMessageOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>endpointMessageOut_1.EndpointMessageOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>endpointMessageOut_1.EndpointMessageOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseEndpointMessageOut.js.map
}),
"[project]/node_modules/svix/dist/models/messageAttemptTriggerType.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageAttemptTriggerTypeSerializer = exports.MessageAttemptTriggerType = void 0;
var MessageAttemptTriggerType;
(function(MessageAttemptTriggerType) {
    MessageAttemptTriggerType[MessageAttemptTriggerType["Scheduled"] = 0] = "Scheduled";
    MessageAttemptTriggerType[MessageAttemptTriggerType["Manual"] = 1] = "Manual";
})(MessageAttemptTriggerType = exports.MessageAttemptTriggerType || (exports.MessageAttemptTriggerType = {}));
exports.MessageAttemptTriggerTypeSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=messageAttemptTriggerType.js.map
}),
"[project]/node_modules/svix/dist/models/messageAttemptOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageAttemptOutSerializer = void 0;
const messageAttemptTriggerType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageAttemptTriggerType.js [app-rsc] (ecmascript)");
const messageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageOut.js [app-rsc] (ecmascript)");
const messageStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatus.js [app-rsc] (ecmascript)");
const messageStatusText_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatusText.js [app-rsc] (ecmascript)");
exports.MessageAttemptOutSerializer = {
    _fromJsonObject (object) {
        return {
            endpointId: object["endpointId"],
            id: object["id"],
            msg: object["msg"] ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"]) : undefined,
            msgId: object["msgId"],
            response: object["response"],
            responseDurationMs: object["responseDurationMs"],
            responseStatusCode: object["responseStatusCode"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
            timestamp: new Date(object["timestamp"]),
            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            endpointId: self.endpointId,
            id: self.id,
            msg: self.msg ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : undefined,
            msgId: self.msgId,
            response: self.response,
            responseDurationMs: self.responseDurationMs,
            responseStatusCode: self.responseStatusCode,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
            timestamp: self.timestamp,
            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
            url: self.url
        };
    }
}; //# sourceMappingURL=messageAttemptOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseMessageAttemptOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseMessageAttemptOutSerializer = void 0;
const messageAttemptOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageAttemptOut.js [app-rsc] (ecmascript)");
exports.ListResponseMessageAttemptOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseMessageAttemptOut.js.map
}),
"[project]/node_modules/svix/dist/models/messageEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageEndpointOutSerializer = void 0;
const messageStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatus.js [app-rsc] (ecmascript)");
const messageStatusText_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatusText.js [app-rsc] (ecmascript)");
exports.MessageEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            channels: object["channels"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
            rateLimit: object["rateLimit"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"],
            version: object["version"]
        };
    },
    _toJsonObject (self) {
        return {
            channels: self.channels,
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            id: self.id,
            nextAttempt: self.nextAttempt,
            rateLimit: self.rateLimit,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url,
            version: self.version
        };
    }
}; //# sourceMappingURL=messageEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseMessageEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseMessageEndpointOutSerializer = void 0;
const messageEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageEndpointOut.js [app-rsc] (ecmascript)");
exports.ListResponseMessageEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseMessageEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/api/messageAttempt.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MessageAttempt = void 0;
const emptyResponse_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/emptyResponse.js [app-rsc] (ecmascript)");
const listResponseEndpointMessageOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseEndpointMessageOut.js [app-rsc] (ecmascript)");
const listResponseMessageAttemptOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseMessageAttemptOut.js [app-rsc] (ecmascript)");
const listResponseMessageEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseMessageEndpointOut.js [app-rsc] (ecmascript)");
const messageAttemptOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageAttemptOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class MessageAttempt {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    listByEndpoint(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            status: options === null || options === void 0 ? void 0 : options.status,
            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            with_msg: options === null || options === void 0 ? void 0 : options.withMsg,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes
        });
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listByMsg(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            status: options === null || options === void 0 ? void 0 : options.status,
            status_code_class: options === null || options === void 0 ? void 0 : options.statusCodeClass,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            endpoint_id: options === null || options === void 0 ? void 0 : options.endpointId,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes
        });
        return request.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listAttemptedMessages(appId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
        request.setPathParam("app_id", appId);
        request.setPathParam("endpoint_id", endpointId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            channel: options === null || options === void 0 ? void 0 : options.channel,
            tag: options === null || options === void 0 ? void 0 : options.tag,
            status: options === null || options === void 0 ? void 0 : options.status,
            before: options === null || options === void 0 ? void 0 : options.before,
            after: options === null || options === void 0 ? void 0 : options.after,
            with_content: options === null || options === void 0 ? void 0 : options.withContent,
            event_types: options === null || options === void 0 ? void 0 : options.eventTypes
        });
        return request.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
    }
    get(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId, attemptId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("attempt_id", attemptId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    listAttemptedDestinations(appId, msgId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator
        });
        return request.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
    }
    resend(appId, msgId, endpointId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
        request.setPathParam("app_id", appId);
        request.setPathParam("msg_id", msgId);
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
}
exports.MessageAttempt = MessageAttempt; //# sourceMappingURL=messageAttempt.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointOutSerializer = void 0;
exports.OperationalWebhookEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            id: self.id,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseOperationalWebhookEndpointOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseOperationalWebhookEndpointOutSerializer = void 0;
const operationalWebhookEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointOut.js [app-rsc] (ecmascript)");
exports.ListResponseOperationalWebhookEndpointOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseOperationalWebhookEndpointOut.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointHeadersIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointHeadersInSerializer = void 0;
exports.OperationalWebhookEndpointHeadersInSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointHeadersIn.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointHeadersOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointHeadersOutSerializer = void 0;
exports.OperationalWebhookEndpointHeadersOutSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"],
            sensitive: object["sensitive"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers,
            sensitive: self.sensitive
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointHeadersOut.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointInSerializer = void 0;
exports.OperationalWebhookEndpointInSerializer = {
    _fromJsonObject (object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
            uid: object["uid"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointIn.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointSecretIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointSecretInSerializer = void 0;
exports.OperationalWebhookEndpointSecretInSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointSecretIn.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointSecretOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointSecretOutSerializer = void 0;
exports.OperationalWebhookEndpointSecretOutSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointSecretOut.js.map
}),
"[project]/node_modules/svix/dist/models/operationalWebhookEndpointUpdate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpointUpdateSerializer = void 0;
exports.OperationalWebhookEndpointUpdateSerializer = {
    _fromJsonObject (object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            url: self.url
        };
    }
}; //# sourceMappingURL=operationalWebhookEndpointUpdate.js.map
}),
"[project]/node_modules/svix/dist/api/operationalWebhookEndpoint.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhookEndpoint = void 0;
const listResponseOperationalWebhookEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseOperationalWebhookEndpointOut.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointHeadersIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointHeadersIn.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointHeadersOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointHeadersOut.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointIn.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointOut.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointSecretIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointSecretIn.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointSecretOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointSecretOut.js [app-rsc] (ecmascript)");
const operationalWebhookEndpointUpdate_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/operationalWebhookEndpointUpdate.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class OperationalWebhookEndpoint {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseOperationalWebhookEndpointOut_1.ListResponseOperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    create(operationalWebhookEndpointIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(operationalWebhookEndpointIn_1.OperationalWebhookEndpointInSerializer._toJsonObject(operationalWebhookEndpointIn));
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    get(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    update(endpointId, operationalWebhookEndpointUpdate) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(operationalWebhookEndpointUpdate_1.OperationalWebhookEndpointUpdateSerializer._toJsonObject(operationalWebhookEndpointUpdate));
        return request.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    delete(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
        request.setPathParam("endpoint_id", endpointId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointHeadersOut_1.OperationalWebhookEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(endpointId, operationalWebhookEndpointHeadersIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
        request.setPathParam("endpoint_id", endpointId);
        request.setBody(operationalWebhookEndpointHeadersIn_1.OperationalWebhookEndpointHeadersInSerializer._toJsonObject(operationalWebhookEndpointHeadersIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
    getSecret(endpointId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret");
        request.setPathParam("endpoint_id", endpointId);
        return request.send(this.requestCtx, operationalWebhookEndpointSecretOut_1.OperationalWebhookEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(endpointId, operationalWebhookEndpointSecretIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret/rotate");
        request.setPathParam("endpoint_id", endpointId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(operationalWebhookEndpointSecretIn_1.OperationalWebhookEndpointSecretInSerializer._toJsonObject(operationalWebhookEndpointSecretIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.OperationalWebhookEndpoint = OperationalWebhookEndpoint; //# sourceMappingURL=operationalWebhookEndpoint.js.map
}),
"[project]/node_modules/svix/dist/api/operationalWebhook.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OperationalWebhook = void 0;
const operationalWebhookEndpoint_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/operationalWebhookEndpoint.js [app-rsc] (ecmascript)");
class OperationalWebhook {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    get endpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
}
exports.OperationalWebhook = OperationalWebhook; //# sourceMappingURL=operationalWebhook.js.map
}),
"[project]/node_modules/svix/dist/models/aggregateEventTypesOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AggregateEventTypesOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.AggregateEventTypesOutSerializer = {
    _fromJsonObject (object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
        };
    },
    _toJsonObject (self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
        };
    }
}; //# sourceMappingURL=aggregateEventTypesOut.js.map
}),
"[project]/node_modules/svix/dist/models/appUsageStatsIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppUsageStatsInSerializer = void 0;
exports.AppUsageStatsInSerializer = {
    _fromJsonObject (object) {
        return {
            appIds: object["appIds"],
            since: new Date(object["since"]),
            until: new Date(object["until"])
        };
    },
    _toJsonObject (self) {
        return {
            appIds: self.appIds,
            since: self.since,
            until: self.until
        };
    }
}; //# sourceMappingURL=appUsageStatsIn.js.map
}),
"[project]/node_modules/svix/dist/models/appUsageStatsOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppUsageStatsOutSerializer = void 0;
const backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
const backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
exports.AppUsageStatsOutSerializer = {
    _fromJsonObject (object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
            unresolvedAppIds: object["unresolvedAppIds"]
        };
    },
    _toJsonObject (self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
            unresolvedAppIds: self.unresolvedAppIds
        };
    }
}; //# sourceMappingURL=appUsageStatsOut.js.map
}),
"[project]/node_modules/svix/dist/api/statistics.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Statistics = void 0;
const aggregateEventTypesOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/aggregateEventTypesOut.js [app-rsc] (ecmascript)");
const appUsageStatsIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appUsageStatsIn.js [app-rsc] (ecmascript)");
const appUsageStatsOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appUsageStatsOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Statistics {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    aggregateAppStats(appUsageStatsIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn));
        return request.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
    }
    aggregateEventTypes() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
        return request.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
    }
}
exports.Statistics = Statistics; //# sourceMappingURL=statistics.js.map
}),
"[project]/node_modules/svix/dist/models/httpSinkHeadersPatchIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HttpSinkHeadersPatchInSerializer = void 0;
exports.HttpSinkHeadersPatchInSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers
        };
    }
}; //# sourceMappingURL=httpSinkHeadersPatchIn.js.map
}),
"[project]/node_modules/svix/dist/models/sinkTransformationOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkTransformationOutSerializer = void 0;
exports.SinkTransformationOutSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"],
            enabled: object["enabled"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code,
            enabled: self.enabled
        };
    }
}; //# sourceMappingURL=sinkTransformationOut.js.map
}),
"[project]/node_modules/svix/dist/models/streamEventTypeOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamEventTypeOutSerializer = void 0;
exports.StreamEventTypeOutSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            createdAt: new Date(object["createdAt"]),
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            name: object["name"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            createdAt: self.createdAt,
            deprecated: self.deprecated,
            description: self.description,
            featureFlags: self.featureFlags,
            name: self.name,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=streamEventTypeOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseStreamEventTypeOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseStreamEventTypeOutSerializer = void 0;
const streamEventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamEventTypeOut.js [app-rsc] (ecmascript)");
exports.ListResponseStreamEventTypeOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>streamEventTypeOut_1.StreamEventTypeOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseStreamEventTypeOut.js.map
}),
"[project]/node_modules/svix/dist/models/streamEventTypeIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamEventTypeInSerializer = void 0;
exports.StreamEventTypeInSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            name: object["name"]
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            deprecated: self.deprecated,
            description: self.description,
            featureFlags: self.featureFlags,
            name: self.name
        };
    }
}; //# sourceMappingURL=streamEventTypeIn.js.map
}),
"[project]/node_modules/svix/dist/models/streamEventTypePatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamEventTypePatchSerializer = void 0;
exports.StreamEventTypePatchSerializer = {
    _fromJsonObject (object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlags: object["featureFlags"],
            name: object["name"]
        };
    },
    _toJsonObject (self) {
        return {
            archived: self.archived,
            deprecated: self.deprecated,
            description: self.description,
            featureFlags: self.featureFlags,
            name: self.name
        };
    }
}; //# sourceMappingURL=streamEventTypePatch.js.map
}),
"[project]/node_modules/svix/dist/api/streamingEventType.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamingEventType = void 0;
const listResponseStreamEventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseStreamEventTypeOut.js [app-rsc] (ecmascript)");
const streamEventTypeIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamEventTypeIn.js [app-rsc] (ecmascript)");
const streamEventTypeOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamEventTypeOut.js [app-rsc] (ecmascript)");
const streamEventTypePatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamEventTypePatch.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class StreamingEventType {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
            include_archived: options === null || options === void 0 ? void 0 : options.includeArchived
        });
        return request.send(this.requestCtx, listResponseStreamEventTypeOut_1.ListResponseStreamEventTypeOutSerializer._fromJsonObject);
    }
    create(streamEventTypeIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/event-type");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    get(name) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    update(name, streamEventTypeIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setBody(streamEventTypeIn_1.StreamEventTypeInSerializer._toJsonObject(streamEventTypeIn));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
    delete(name, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setQueryParams({
            expunge: options === null || options === void 0 ? void 0 : options.expunge
        });
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(name, streamEventTypePatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/event-type/{name}");
        request.setPathParam("name", name);
        request.setBody(streamEventTypePatch_1.StreamEventTypePatchSerializer._toJsonObject(streamEventTypePatch));
        return request.send(this.requestCtx, streamEventTypeOut_1.StreamEventTypeOutSerializer._fromJsonObject);
    }
}
exports.StreamingEventType = StreamingEventType; //# sourceMappingURL=streamingEventType.js.map
}),
"[project]/node_modules/svix/dist/models/eventIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventInSerializer = void 0;
exports.EventInSerializer = {
    _fromJsonObject (object) {
        return {
            eventType: object["eventType"],
            payload: object["payload"]
        };
    },
    _toJsonObject (self) {
        return {
            eventType: self.eventType,
            payload: self.payload
        };
    }
}; //# sourceMappingURL=eventIn.js.map
}),
"[project]/node_modules/svix/dist/models/streamIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamInSerializer = void 0;
exports.StreamInSerializer = {
    _fromJsonObject (object) {
        return {
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        return {
            metadata: self.metadata,
            name: self.name,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=streamIn.js.map
}),
"[project]/node_modules/svix/dist/models/createStreamEventsIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CreateStreamEventsInSerializer = void 0;
const eventIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventIn.js [app-rsc] (ecmascript)");
const streamIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamIn.js [app-rsc] (ecmascript)");
exports.CreateStreamEventsInSerializer = {
    _fromJsonObject (object) {
        return {
            events: object["events"].map((item)=>eventIn_1.EventInSerializer._fromJsonObject(item)),
            stream: object["stream"] ? streamIn_1.StreamInSerializer._fromJsonObject(object["stream"]) : undefined
        };
    },
    _toJsonObject (self) {
        return {
            events: self.events.map((item)=>eventIn_1.EventInSerializer._toJsonObject(item)),
            stream: self.stream ? streamIn_1.StreamInSerializer._toJsonObject(self.stream) : undefined
        };
    }
}; //# sourceMappingURL=createStreamEventsIn.js.map
}),
"[project]/node_modules/svix/dist/models/createStreamEventsOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CreateStreamEventsOutSerializer = void 0;
exports.CreateStreamEventsOutSerializer = {
    _fromJsonObject (_object) {
        return {};
    },
    _toJsonObject (_self) {
        return {};
    }
}; //# sourceMappingURL=createStreamEventsOut.js.map
}),
"[project]/node_modules/svix/dist/models/eventOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventOutSerializer = void 0;
exports.EventOutSerializer = {
    _fromJsonObject (object) {
        return {
            eventType: object["eventType"],
            payload: object["payload"],
            timestamp: new Date(object["timestamp"])
        };
    },
    _toJsonObject (self) {
        return {
            eventType: self.eventType,
            payload: self.payload,
            timestamp: self.timestamp
        };
    }
}; //# sourceMappingURL=eventOut.js.map
}),
"[project]/node_modules/svix/dist/models/eventStreamOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EventStreamOutSerializer = void 0;
const eventOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventOut.js [app-rsc] (ecmascript)");
exports.EventStreamOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>eventOut_1.EventOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>eventOut_1.EventOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator
        };
    }
}; //# sourceMappingURL=eventStreamOut.js.map
}),
"[project]/node_modules/svix/dist/api/streamingEvents.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamingEvents = void 0;
const createStreamEventsIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/createStreamEventsIn.js [app-rsc] (ecmascript)");
const createStreamEventsOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/createStreamEventsOut.js [app-rsc] (ecmascript)");
const eventStreamOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/eventStreamOut.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class StreamingEvents {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    create(streamId, createStreamEventsIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/events");
        request.setPathParam("stream_id", streamId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(createStreamEventsIn_1.CreateStreamEventsInSerializer._toJsonObject(createStreamEventsIn));
        return request.send(this.requestCtx, createStreamEventsOut_1.CreateStreamEventsOutSerializer._fromJsonObject);
    }
    get(streamId, sinkId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/events");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            after: options === null || options === void 0 ? void 0 : options.after
        });
        return request.send(this.requestCtx, eventStreamOut_1.EventStreamOutSerializer._fromJsonObject);
    }
}
exports.StreamingEvents = StreamingEvents; //# sourceMappingURL=streamingEvents.js.map
}),
"[project]/node_modules/svix/dist/models/azureBlobStorageConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AzureBlobStorageConfigSerializer = void 0;
exports.AzureBlobStorageConfigSerializer = {
    _fromJsonObject (object) {
        return {
            accessKey: object["accessKey"],
            account: object["account"],
            container: object["container"]
        };
    },
    _toJsonObject (self) {
        return {
            accessKey: self.accessKey,
            account: self.account,
            container: self.container
        };
    }
}; //# sourceMappingURL=azureBlobStorageConfig.js.map
}),
"[project]/node_modules/svix/dist/models/googleCloudStorageConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GoogleCloudStorageConfigSerializer = void 0;
exports.GoogleCloudStorageConfigSerializer = {
    _fromJsonObject (object) {
        return {
            bucket: object["bucket"],
            credentials: object["credentials"]
        };
    },
    _toJsonObject (self) {
        return {
            bucket: self.bucket,
            credentials: self.credentials
        };
    }
}; //# sourceMappingURL=googleCloudStorageConfig.js.map
}),
"[project]/node_modules/svix/dist/models/s3Config.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.S3ConfigSerializer = void 0;
exports.S3ConfigSerializer = {
    _fromJsonObject (object) {
        return {
            accessKeyId: object["accessKeyId"],
            bucket: object["bucket"],
            region: object["region"],
            secretAccessKey: object["secretAccessKey"]
        };
    },
    _toJsonObject (self) {
        return {
            accessKeyId: self.accessKeyId,
            bucket: self.bucket,
            region: self.region,
            secretAccessKey: self.secretAccessKey
        };
    }
}; //# sourceMappingURL=s3Config.js.map
}),
"[project]/node_modules/svix/dist/models/sinkHttpConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkHttpConfigSerializer = void 0;
exports.SinkHttpConfigSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"],
            key: object["key"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers,
            key: self.key,
            url: self.url
        };
    }
}; //# sourceMappingURL=sinkHttpConfig.js.map
}),
"[project]/node_modules/svix/dist/models/sinkOtelV1Config.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkOtelV1ConfigSerializer = void 0;
exports.SinkOtelV1ConfigSerializer = {
    _fromJsonObject (object) {
        return {
            headers: object["headers"],
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            headers: self.headers,
            url: self.url
        };
    }
}; //# sourceMappingURL=sinkOtelV1Config.js.map
}),
"[project]/node_modules/svix/dist/models/sinkStatus.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkStatusSerializer = exports.SinkStatus = void 0;
var SinkStatus;
(function(SinkStatus) {
    SinkStatus["Enabled"] = "enabled";
    SinkStatus["Paused"] = "paused";
    SinkStatus["Disabled"] = "disabled";
    SinkStatus["Retrying"] = "retrying";
})(SinkStatus = exports.SinkStatus || (exports.SinkStatus = {}));
exports.SinkStatusSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=sinkStatus.js.map
}),
"[project]/node_modules/svix/dist/models/streamSinkOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamSinkOutSerializer = void 0;
const azureBlobStorageConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/azureBlobStorageConfig.js [app-rsc] (ecmascript)");
const googleCloudStorageConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/googleCloudStorageConfig.js [app-rsc] (ecmascript)");
const s3Config_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/s3Config.js [app-rsc] (ecmascript)");
const sinkHttpConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkHttpConfig.js [app-rsc] (ecmascript)");
const sinkOtelV1Config_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkOtelV1Config.js [app-rsc] (ecmascript)");
const sinkStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkStatus.js [app-rsc] (ecmascript)");
exports.StreamSinkOutSerializer = {
    _fromJsonObject (object) {
        const type = object["type"];
        function getConfig(type) {
            switch(type){
                case "poller":
                    return {};
                case "azureBlobStorage":
                    return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
                case "otelTracing":
                    return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
                case "http":
                    return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
                case "amazonS3":
                    return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
                case "googleCloudStorage":
                    return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            batchSize: object["batchSize"],
            createdAt: new Date(object["createdAt"]),
            currentIterator: object["currentIterator"],
            eventTypes: object["eventTypes"],
            failureReason: object["failureReason"],
            id: object["id"],
            maxWaitSecs: object["maxWaitSecs"],
            metadata: object["metadata"],
            nextRetryAt: object["nextRetryAt"] ? new Date(object["nextRetryAt"]) : null,
            status: sinkStatus_1.SinkStatusSerializer._fromJsonObject(object["status"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        let config;
        switch(self.type){
            case "poller":
                config = {};
                break;
            case "azureBlobStorage":
                config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
                break;
            case "otelTracing":
                config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
                break;
            case "http":
                config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
                break;
            case "amazonS3":
                config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
                break;
            case "googleCloudStorage":
                config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            batchSize: self.batchSize,
            createdAt: self.createdAt,
            currentIterator: self.currentIterator,
            eventTypes: self.eventTypes,
            failureReason: self.failureReason,
            id: self.id,
            maxWaitSecs: self.maxWaitSecs,
            metadata: self.metadata,
            nextRetryAt: self.nextRetryAt,
            status: sinkStatus_1.SinkStatusSerializer._toJsonObject(self.status),
            uid: self.uid,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=streamSinkOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseStreamSinkOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseStreamSinkOutSerializer = void 0;
const streamSinkOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamSinkOut.js [app-rsc] (ecmascript)");
exports.ListResponseStreamSinkOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>streamSinkOut_1.StreamSinkOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseStreamSinkOut.js.map
}),
"[project]/node_modules/svix/dist/models/sinkSecretOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkSecretOutSerializer = void 0;
exports.SinkSecretOutSerializer = {
    _fromJsonObject (object) {
        return {
            key: object["key"]
        };
    },
    _toJsonObject (self) {
        return {
            key: self.key
        };
    }
}; //# sourceMappingURL=sinkSecretOut.js.map
}),
"[project]/node_modules/svix/dist/models/sinkTransformIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkTransformInSerializer = void 0;
exports.SinkTransformInSerializer = {
    _fromJsonObject (object) {
        return {
            code: object["code"]
        };
    },
    _toJsonObject (self) {
        return {
            code: self.code
        };
    }
}; //# sourceMappingURL=sinkTransformIn.js.map
}),
"[project]/node_modules/svix/dist/models/sinkStatusIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SinkStatusInSerializer = exports.SinkStatusIn = void 0;
var SinkStatusIn;
(function(SinkStatusIn) {
    SinkStatusIn["Enabled"] = "enabled";
    SinkStatusIn["Disabled"] = "disabled";
})(SinkStatusIn = exports.SinkStatusIn || (exports.SinkStatusIn = {}));
exports.SinkStatusInSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=sinkStatusIn.js.map
}),
"[project]/node_modules/svix/dist/models/streamSinkIn.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamSinkInSerializer = void 0;
const azureBlobStorageConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/azureBlobStorageConfig.js [app-rsc] (ecmascript)");
const googleCloudStorageConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/googleCloudStorageConfig.js [app-rsc] (ecmascript)");
const s3Config_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/s3Config.js [app-rsc] (ecmascript)");
const sinkHttpConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkHttpConfig.js [app-rsc] (ecmascript)");
const sinkOtelV1Config_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkOtelV1Config.js [app-rsc] (ecmascript)");
const sinkStatusIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkStatusIn.js [app-rsc] (ecmascript)");
exports.StreamSinkInSerializer = {
    _fromJsonObject (object) {
        const type = object["type"];
        function getConfig(type) {
            switch(type){
                case "poller":
                    return {};
                case "azureBlobStorage":
                    return azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._fromJsonObject(object["config"]);
                case "otelTracing":
                    return sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._fromJsonObject(object["config"]);
                case "http":
                    return sinkHttpConfig_1.SinkHttpConfigSerializer._fromJsonObject(object["config"]);
                case "amazonS3":
                    return s3Config_1.S3ConfigSerializer._fromJsonObject(object["config"]);
                case "googleCloudStorage":
                    return googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            batchSize: object["batchSize"],
            eventTypes: object["eventTypes"],
            maxWaitSecs: object["maxWaitSecs"],
            metadata: object["metadata"],
            status: object["status"] ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"]) : undefined,
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        let config;
        switch(self.type){
            case "poller":
                config = {};
                break;
            case "azureBlobStorage":
                config = azureBlobStorageConfig_1.AzureBlobStorageConfigSerializer._toJsonObject(self.config);
                break;
            case "otelTracing":
                config = sinkOtelV1Config_1.SinkOtelV1ConfigSerializer._toJsonObject(self.config);
                break;
            case "http":
                config = sinkHttpConfig_1.SinkHttpConfigSerializer._toJsonObject(self.config);
                break;
            case "amazonS3":
                config = s3Config_1.S3ConfigSerializer._toJsonObject(self.config);
                break;
            case "googleCloudStorage":
                config = googleCloudStorageConfig_1.GoogleCloudStorageConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            batchSize: self.batchSize,
            eventTypes: self.eventTypes,
            maxWaitSecs: self.maxWaitSecs,
            metadata: self.metadata,
            status: self.status ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status) : undefined,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=streamSinkIn.js.map
}),
"[project]/node_modules/svix/dist/models/amazonS3PatchConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AmazonS3PatchConfigSerializer = void 0;
exports.AmazonS3PatchConfigSerializer = {
    _fromJsonObject (object) {
        return {
            accessKeyId: object["accessKeyId"],
            bucket: object["bucket"],
            region: object["region"],
            secretAccessKey: object["secretAccessKey"]
        };
    },
    _toJsonObject (self) {
        return {
            accessKeyId: self.accessKeyId,
            bucket: self.bucket,
            region: self.region,
            secretAccessKey: self.secretAccessKey
        };
    }
}; //# sourceMappingURL=amazonS3PatchConfig.js.map
}),
"[project]/node_modules/svix/dist/models/azureBlobStoragePatchConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AzureBlobStoragePatchConfigSerializer = void 0;
exports.AzureBlobStoragePatchConfigSerializer = {
    _fromJsonObject (object) {
        return {
            accessKey: object["accessKey"],
            account: object["account"],
            container: object["container"]
        };
    },
    _toJsonObject (self) {
        return {
            accessKey: self.accessKey,
            account: self.account,
            container: self.container
        };
    }
}; //# sourceMappingURL=azureBlobStoragePatchConfig.js.map
}),
"[project]/node_modules/svix/dist/models/googleCloudStoragePatchConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GoogleCloudStoragePatchConfigSerializer = void 0;
exports.GoogleCloudStoragePatchConfigSerializer = {
    _fromJsonObject (object) {
        return {
            bucket: object["bucket"],
            credentials: object["credentials"]
        };
    },
    _toJsonObject (self) {
        return {
            bucket: self.bucket,
            credentials: self.credentials
        };
    }
}; //# sourceMappingURL=googleCloudStoragePatchConfig.js.map
}),
"[project]/node_modules/svix/dist/models/httpPatchConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HttpPatchConfigSerializer = void 0;
exports.HttpPatchConfigSerializer = {
    _fromJsonObject (object) {
        return {
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            url: self.url
        };
    }
}; //# sourceMappingURL=httpPatchConfig.js.map
}),
"[project]/node_modules/svix/dist/models/otelTracingPatchConfig.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OtelTracingPatchConfigSerializer = void 0;
exports.OtelTracingPatchConfigSerializer = {
    _fromJsonObject (object) {
        return {
            url: object["url"]
        };
    },
    _toJsonObject (self) {
        return {
            url: self.url
        };
    }
}; //# sourceMappingURL=otelTracingPatchConfig.js.map
}),
"[project]/node_modules/svix/dist/models/streamSinkPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamSinkPatchSerializer = void 0;
const amazonS3PatchConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/amazonS3PatchConfig.js [app-rsc] (ecmascript)");
const azureBlobStoragePatchConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/azureBlobStoragePatchConfig.js [app-rsc] (ecmascript)");
const googleCloudStoragePatchConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/googleCloudStoragePatchConfig.js [app-rsc] (ecmascript)");
const httpPatchConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/httpPatchConfig.js [app-rsc] (ecmascript)");
const otelTracingPatchConfig_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/otelTracingPatchConfig.js [app-rsc] (ecmascript)");
const sinkStatusIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkStatusIn.js [app-rsc] (ecmascript)");
exports.StreamSinkPatchSerializer = {
    _fromJsonObject (object) {
        const type = object["type"];
        function getConfig(type) {
            switch(type){
                case "poller":
                    return {};
                case "azureBlobStorage":
                    return azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._fromJsonObject(object["config"]);
                case "otelTracing":
                    return otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._fromJsonObject(object["config"]);
                case "http":
                    return httpPatchConfig_1.HttpPatchConfigSerializer._fromJsonObject(object["config"]);
                case "amazonS3":
                    return amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._fromJsonObject(object["config"]);
                case "googleCloudStorage":
                    return googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._fromJsonObject(object["config"]);
                default:
                    throw new Error(`Unexpected type: ${type}`);
            }
        }
        return {
            type,
            config: getConfig(type),
            batchSize: object["batchSize"],
            eventTypes: object["eventTypes"],
            maxWaitSecs: object["maxWaitSecs"],
            metadata: object["metadata"],
            status: object["status"] ? sinkStatusIn_1.SinkStatusInSerializer._fromJsonObject(object["status"]) : undefined,
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        let config;
        switch(self.type){
            case "poller":
                config = {};
                break;
            case "azureBlobStorage":
                config = azureBlobStoragePatchConfig_1.AzureBlobStoragePatchConfigSerializer._toJsonObject(self.config);
                break;
            case "otelTracing":
                config = otelTracingPatchConfig_1.OtelTracingPatchConfigSerializer._toJsonObject(self.config);
                break;
            case "http":
                config = httpPatchConfig_1.HttpPatchConfigSerializer._toJsonObject(self.config);
                break;
            case "amazonS3":
                config = amazonS3PatchConfig_1.AmazonS3PatchConfigSerializer._toJsonObject(self.config);
                break;
            case "googleCloudStorage":
                config = googleCloudStoragePatchConfig_1.GoogleCloudStoragePatchConfigSerializer._toJsonObject(self.config);
                break;
        }
        return {
            type: self.type,
            config: config,
            batchSize: self.batchSize,
            eventTypes: self.eventTypes,
            maxWaitSecs: self.maxWaitSecs,
            metadata: self.metadata,
            status: self.status ? sinkStatusIn_1.SinkStatusInSerializer._toJsonObject(self.status) : undefined,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=streamSinkPatch.js.map
}),
"[project]/node_modules/svix/dist/api/streamingSink.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamingSink = void 0;
const emptyResponse_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/emptyResponse.js [app-rsc] (ecmascript)");
const endpointSecretRotateIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointSecretRotateIn.js [app-rsc] (ecmascript)");
const listResponseStreamSinkOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseStreamSinkOut.js [app-rsc] (ecmascript)");
const sinkSecretOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkSecretOut.js [app-rsc] (ecmascript)");
const sinkTransformIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkTransformIn.js [app-rsc] (ecmascript)");
const streamSinkIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamSinkIn.js [app-rsc] (ecmascript)");
const streamSinkOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamSinkOut.js [app-rsc] (ecmascript)");
const streamSinkPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamSinkPatch.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class StreamingSink {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(streamId, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink");
        request.setPathParam("stream_id", streamId);
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseStreamSinkOut_1.ListResponseStreamSinkOutSerializer._fromJsonObject);
    }
    create(streamId, streamSinkIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink");
        request.setPathParam("stream_id", streamId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    get(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    update(streamId, sinkId, streamSinkIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}/sink/{sink_id}");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setBody(streamSinkIn_1.StreamSinkInSerializer._toJsonObject(streamSinkIn));
        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    delete(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}/sink/{sink_id}");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(streamId, sinkId, streamSinkPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setBody(streamSinkPatch_1.StreamSinkPatchSerializer._toJsonObject(streamSinkPatch));
        return request.send(this.requestCtx, streamSinkOut_1.StreamSinkOutSerializer._fromJsonObject);
    }
    getSecret(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, sinkSecretOut_1.SinkSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(streamId, sinkId, endpointSecretRotateIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream/{stream_id}/sink/{sink_id}/secret/rotate");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn));
        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
    transformationPartialUpdate(streamId, sinkId, sinkTransformIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setBody(sinkTransformIn_1.SinkTransformInSerializer._toJsonObject(sinkTransformIn));
        return request.send(this.requestCtx, emptyResponse_1.EmptyResponseSerializer._fromJsonObject);
    }
}
exports.StreamingSink = StreamingSink; //# sourceMappingURL=streamingSink.js.map
}),
"[project]/node_modules/svix/dist/models/streamOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamOutSerializer = void 0;
exports.StreamOutSerializer = {
    _fromJsonObject (object) {
        return {
            createdAt: new Date(object["createdAt"]),
            id: object["id"],
            metadata: object["metadata"],
            name: object["name"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"])
        };
    },
    _toJsonObject (self) {
        return {
            createdAt: self.createdAt,
            id: self.id,
            metadata: self.metadata,
            name: self.name,
            uid: self.uid,
            updatedAt: self.updatedAt
        };
    }
}; //# sourceMappingURL=streamOut.js.map
}),
"[project]/node_modules/svix/dist/models/listResponseStreamOut.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListResponseStreamOutSerializer = void 0;
const streamOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamOut.js [app-rsc] (ecmascript)");
exports.ListResponseStreamOutSerializer = {
    _fromJsonObject (object) {
        return {
            data: object["data"].map((item)=>streamOut_1.StreamOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"]
        };
    },
    _toJsonObject (self) {
        return {
            data: self.data.map((item)=>streamOut_1.StreamOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator
        };
    }
}; //# sourceMappingURL=listResponseStreamOut.js.map
}),
"[project]/node_modules/svix/dist/models/streamPatch.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamPatchSerializer = void 0;
exports.StreamPatchSerializer = {
    _fromJsonObject (object) {
        return {
            description: object["description"],
            metadata: object["metadata"],
            uid: object["uid"]
        };
    },
    _toJsonObject (self) {
        return {
            description: self.description,
            metadata: self.metadata,
            uid: self.uid
        };
    }
}; //# sourceMappingURL=streamPatch.js.map
}),
"[project]/node_modules/svix/dist/api/streamingStream.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamingStream = void 0;
const listResponseStreamOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/listResponseStreamOut.js [app-rsc] (ecmascript)");
const streamIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamIn.js [app-rsc] (ecmascript)");
const streamOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamOut.js [app-rsc] (ecmascript)");
const streamPatch_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/streamPatch.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class StreamingStream {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream");
        request.setQueryParams({
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order
        });
        return request.send(this.requestCtx, listResponseStreamOut_1.ListResponseStreamOutSerializer._fromJsonObject);
    }
    create(streamIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stream");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    get(streamId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    update(streamId, streamIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        request.setBody(streamIn_1.StreamInSerializer._toJsonObject(streamIn));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
    delete(streamId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        return request.sendNoResponseBody(this.requestCtx);
    }
    patch(streamId, streamPatch) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}");
        request.setPathParam("stream_id", streamId);
        request.setBody(streamPatch_1.StreamPatchSerializer._toJsonObject(streamPatch));
        return request.send(this.requestCtx, streamOut_1.StreamOutSerializer._fromJsonObject);
    }
}
exports.StreamingStream = StreamingStream; //# sourceMappingURL=streamingStream.js.map
}),
"[project]/node_modules/svix/dist/api/streaming.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Streaming = void 0;
const endpointHeadersOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointHeadersOut.js [app-rsc] (ecmascript)");
const httpSinkHeadersPatchIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/httpSinkHeadersPatchIn.js [app-rsc] (ecmascript)");
const sinkTransformationOut_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkTransformationOut.js [app-rsc] (ecmascript)");
const streamingEventType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/streamingEventType.js [app-rsc] (ecmascript)");
const streamingEvents_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/streamingEvents.js [app-rsc] (ecmascript)");
const streamingSink_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/streamingSink.js [app-rsc] (ecmascript)");
const streamingStream_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/streamingStream.js [app-rsc] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/request.js [app-rsc] (ecmascript)");
class Streaming {
    constructor(requestCtx){
        this.requestCtx = requestCtx;
    }
    get event_type() {
        return new streamingEventType_1.StreamingEventType(this.requestCtx);
    }
    get events() {
        return new streamingEvents_1.StreamingEvents(this.requestCtx);
    }
    get sink() {
        return new streamingSink_1.StreamingSink(this.requestCtx);
    }
    get stream() {
        return new streamingStream_1.StreamingStream(this.requestCtx);
    }
    sinkHeadersGet(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkHeadersPatch(streamId, sinkId, httpSinkHeadersPatchIn) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/stream/{stream_id}/sink/{sink_id}/headers");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        request.setBody(httpSinkHeadersPatchIn_1.HttpSinkHeadersPatchInSerializer._toJsonObject(httpSinkHeadersPatchIn));
        return request.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    sinkTransformationGet(streamId, sinkId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/stream/{stream_id}/sink/{sink_id}/transformation");
        request.setPathParam("stream_id", streamId);
        request.setPathParam("sink_id", sinkId);
        return request.send(this.requestCtx, sinkTransformationOut_1.SinkTransformationOutSerializer._fromJsonObject);
    }
}
exports.Streaming = Streaming; //# sourceMappingURL=streaming.js.map
}),
"[project]/node_modules/svix/dist/HttpErrors.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HTTPValidationError = exports.ValidationError = exports.HttpErrorOut = void 0;
class HttpErrorOut {
    static getAttributeTypeMap() {
        return HttpErrorOut.attributeTypeMap;
    }
}
exports.HttpErrorOut = HttpErrorOut;
HttpErrorOut.discriminator = undefined;
HttpErrorOut.mapping = undefined;
HttpErrorOut.attributeTypeMap = [
    {
        name: "code",
        baseName: "code",
        type: "string",
        format: ""
    },
    {
        name: "detail",
        baseName: "detail",
        type: "string",
        format: ""
    }
];
class ValidationError {
    static getAttributeTypeMap() {
        return ValidationError.attributeTypeMap;
    }
}
exports.ValidationError = ValidationError;
ValidationError.discriminator = undefined;
ValidationError.mapping = undefined;
ValidationError.attributeTypeMap = [
    {
        name: "loc",
        baseName: "loc",
        type: "Array<string>",
        format: ""
    },
    {
        name: "msg",
        baseName: "msg",
        type: "string",
        format: ""
    },
    {
        name: "type",
        baseName: "type",
        type: "string",
        format: ""
    }
];
class HTTPValidationError {
    static getAttributeTypeMap() {
        return HTTPValidationError.attributeTypeMap;
    }
}
exports.HTTPValidationError = HTTPValidationError;
HTTPValidationError.discriminator = undefined;
HTTPValidationError.mapping = undefined;
HTTPValidationError.attributeTypeMap = [
    {
        name: "detail",
        baseName: "detail",
        type: "Array<ValidationError>",
        format: ""
    }
]; //# sourceMappingURL=HttpErrors.js.map
}),
"[project]/node_modules/standardwebhooks/dist/timing_safe_equal.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.timingSafeEqual = void 0;
function assert(expr, msg = "") {
    if (!expr) {
        throw new Error(msg);
    }
}
function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
    }
    if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while(++i < length){
        out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
}
exports.timingSafeEqual = timingSafeEqual; //# sourceMappingURL=timing_safe_equal.js.map
}),
"[project]/node_modules/@stablelib/base64/lib/base64.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
var __extends = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__extends || function() {
    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (b.hasOwnProperty(p)) d[p] = b[p];
        };
        return extendStatics(d, b);
    };
    return function(d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Package base64 implements Base64 encoding and decoding.
 */ // Invalid character used in decoding to indicate
// that the character to decode is out of range of
// alphabet and cannot be decoded.
var INVALID_BYTE = 256;
/**
 * Implements standard Base64 encoding.
 *
 * Operates in constant time.
 */ var Coder = function() {
    // TODO(dchest): methods to encode chunk-by-chunk.
    function Coder(_paddingCharacter) {
        if (_paddingCharacter === void 0) {
            _paddingCharacter = "=";
        }
        this._paddingCharacter = _paddingCharacter;
    }
    Coder.prototype.encodedLength = function(length) {
        if (!this._paddingCharacter) {
            return (length * 8 + 5) / 6 | 0;
        }
        return (length + 2) / 3 * 4 | 0;
    };
    Coder.prototype.encode = function(data) {
        var out = "";
        var i = 0;
        for(; i < data.length - 2; i += 3){
            var c = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            out += this._encodeByte(c >>> 1 * 6 & 63);
            out += this._encodeByte(c >>> 0 * 6 & 63);
        }
        var left = data.length - i;
        if (left > 0) {
            var c = data[i] << 16 | (left === 2 ? data[i + 1] << 8 : 0);
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            if (left === 2) {
                out += this._encodeByte(c >>> 1 * 6 & 63);
            } else {
                out += this._paddingCharacter || "";
            }
            out += this._paddingCharacter || "";
        }
        return out;
    };
    Coder.prototype.maxDecodedLength = function(length) {
        if (!this._paddingCharacter) {
            return (length * 6 + 7) / 8 | 0;
        }
        return length / 4 * 3 | 0;
    };
    Coder.prototype.decodedLength = function(s) {
        return this.maxDecodedLength(s.length - this._getPaddingLength(s));
    };
    Coder.prototype.decode = function(s) {
        if (s.length === 0) {
            return new Uint8Array(0);
        }
        var paddingLength = this._getPaddingLength(s);
        var length = s.length - paddingLength;
        var out = new Uint8Array(this.maxDecodedLength(length));
        var op = 0;
        var i = 0;
        var haveBad = 0;
        var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
        for(; i < length - 4; i += 4){
            v0 = this._decodeChar(s.charCodeAt(i + 0));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v0 << 2 | v1 >>> 4;
            out[op++] = v1 << 4 | v2 >>> 2;
            out[op++] = v2 << 6 | v3;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
            haveBad |= v2 & INVALID_BYTE;
            haveBad |= v3 & INVALID_BYTE;
        }
        if (i < length - 1) {
            v0 = this._decodeChar(s.charCodeAt(i));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            out[op++] = v0 << 2 | v1 >>> 4;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
        }
        if (i < length - 2) {
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            out[op++] = v1 << 4 | v2 >>> 2;
            haveBad |= v2 & INVALID_BYTE;
        }
        if (i < length - 3) {
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v2 << 6 | v3;
            haveBad |= v3 & INVALID_BYTE;
        }
        if (haveBad !== 0) {
            throw new Error("Base64Coder: incorrect characters for decoding");
        }
        return out;
    };
    // Standard encoding have the following encoded/decoded ranges,
    // which we need to convert between.
    //
    // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  +   /
    // Index:   0 - 25                    26 - 51              52 - 61   62  63
    // ASCII:  65 - 90                    97 - 122             48 - 57   43  47
    //
    // Encode 6 bits in b into a new character.
    Coder.prototype._encodeByte = function(b) {
        // Encoding uses constant time operations as follows:
        //
        // 1. Define comparison of A with B using (A - B) >>> 8:
        //          if A > B, then result is positive integer
        //          if A <= B, then result is 0
        //
        // 2. Define selection of C or 0 using bitwise AND: X & C:
        //          if X == 0, then result is 0
        //          if X != 0, then result is C
        //
        // 3. Start with the smallest comparison (b >= 0), which is always
        //    true, so set the result to the starting ASCII value (65).
        //
        // 4. Continue comparing b to higher ASCII values, and selecting
        //    zero if comparison isn't true, otherwise selecting a value
        //    to add to result, which:
        //
        //          a) undoes the previous addition
        //          b) provides new value to add
        //
        var result = b;
        // b >= 0
        result += 65;
        // b > 25
        result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
        // b > 51
        result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
        // b > 61
        result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
        // b > 62
        result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
        return String.fromCharCode(result);
    };
    // Decode a character code into a byte.
    // Must return 256 if character is out of alphabet range.
    Coder.prototype._decodeChar = function(c) {
        // Decoding works similar to encoding: using the same comparison
        // function, but now it works on ranges: result is always incremented
        // by value, but this value becomes zero if the range is not
        // satisfied.
        //
        // Decoding starts with invalid value, 256, which is then
        // subtracted when the range is satisfied. If none of the ranges
        // apply, the function returns 256, which is then checked by
        // the caller to throw error.
        var result = INVALID_BYTE; // start with invalid character
        // c == 43 (c > 42 and c < 44)
        result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
        // c == 47 (c > 46 and c < 48)
        result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
        // c > 47 and c < 58
        result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
        // c > 64 and c < 91
        result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
        // c > 96 and c < 123
        result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
        return result;
    };
    Coder.prototype._getPaddingLength = function(s) {
        var paddingLength = 0;
        if (this._paddingCharacter) {
            for(var i = s.length - 1; i >= 0; i--){
                if (s[i] !== this._paddingCharacter) {
                    break;
                }
                paddingLength++;
            }
            if (s.length < 4 || paddingLength > 2) {
                throw new Error("Base64Coder: incorrect padding");
            }
        }
        return paddingLength;
    };
    return Coder;
}();
exports.Coder = Coder;
var stdCoder = new Coder();
function encode(data) {
    return stdCoder.encode(data);
}
exports.encode = encode;
function decode(s) {
    return stdCoder.decode(s);
}
exports.decode = decode;
/**
 * Implements URL-safe Base64 encoding.
 * (Same as Base64, but '+' is replaced with '-', and '/' with '_').
 *
 * Operates in constant time.
 */ var URLSafeCoder = function(_super) {
    __extends(URLSafeCoder, _super);
    function URLSafeCoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // URL-safe encoding have the following encoded/decoded ranges:
    //
    // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  -   _
    // Index:   0 - 25                    26 - 51              52 - 61   62  63
    // ASCII:  65 - 90                    97 - 122             48 - 57   45  95
    //
    URLSafeCoder.prototype._encodeByte = function(b) {
        var result = b;
        // b >= 0
        result += 65;
        // b > 25
        result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
        // b > 51
        result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
        // b > 61
        result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
        // b > 62
        result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
        return String.fromCharCode(result);
    };
    URLSafeCoder.prototype._decodeChar = function(c) {
        var result = INVALID_BYTE;
        // c == 45 (c > 44 and c < 46)
        result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
        // c == 95 (c > 94 and c < 96)
        result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
        // c > 47 and c < 58
        result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
        // c > 64 and c < 91
        result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
        // c > 96 and c < 123
        result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
        return result;
    };
    return URLSafeCoder;
}(Coder);
exports.URLSafeCoder = URLSafeCoder;
var urlSafeCoder = new URLSafeCoder();
function encodeURLSafe(data) {
    return urlSafeCoder.encode(data);
}
exports.encodeURLSafe = encodeURLSafe;
function decodeURLSafe(s) {
    return urlSafeCoder.decode(s);
}
exports.decodeURLSafe = decodeURLSafe;
exports.encodedLength = function(length) {
    return stdCoder.encodedLength(length);
};
exports.maxDecodedLength = function(length) {
    return stdCoder.maxDecodedLength(length);
};
exports.decodedLength = function(s) {
    return stdCoder.decodedLength(s);
}; //# sourceMappingURL=base64.js.map
}),
"[project]/node_modules/fast-sha256/sha256.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

(function(root, factory) {
    // Hack to make all exports of this module sha256 function object properties.
    var exports = {};
    factory(exports);
    var sha256 = exports["default"];
    for(var k in exports){
        sha256[k] = exports[k];
    }
    if (("TURBOPACK compile-time value", "object") === 'object' && typeof module.exports === 'object') {
        module.exports = sha256;
    } else if (typeof define === 'function' && define.amd) {
        ((r)=>r !== undefined && __turbopack_context__.v(r))(function() {
            return sha256;
        }(__turbopack_context__.r, exports, module));
    } else {
        root.sha256 = sha256;
    }
})(/*TURBOPACK member replacement*/ __turbopack_context__.e, function(exports) {
    "use strict";
    exports.__esModule = true;
    // SHA-256 (+ HMAC and PBKDF2) for JavaScript.
    //
    // Written in 2014-2016 by Dmitry Chestnykh.
    // Public domain, no warranty.
    //
    // Functions (accept and return Uint8Arrays):
    //
    //   sha256(message) -> hash
    //   sha256.hmac(key, message) -> mac
    //   sha256.pbkdf2(password, salt, rounds, dkLen) -> dk
    //
    //  Classes:
    //
    //   new sha256.Hash()
    //   new sha256.HMAC(key)
    //
    exports.digestLength = 32;
    exports.blockSize = 64;
    // SHA-256 constants
    var K = new Uint32Array([
        0x428a2f98,
        0x71374491,
        0xb5c0fbcf,
        0xe9b5dba5,
        0x3956c25b,
        0x59f111f1,
        0x923f82a4,
        0xab1c5ed5,
        0xd807aa98,
        0x12835b01,
        0x243185be,
        0x550c7dc3,
        0x72be5d74,
        0x80deb1fe,
        0x9bdc06a7,
        0xc19bf174,
        0xe49b69c1,
        0xefbe4786,
        0x0fc19dc6,
        0x240ca1cc,
        0x2de92c6f,
        0x4a7484aa,
        0x5cb0a9dc,
        0x76f988da,
        0x983e5152,
        0xa831c66d,
        0xb00327c8,
        0xbf597fc7,
        0xc6e00bf3,
        0xd5a79147,
        0x06ca6351,
        0x14292967,
        0x27b70a85,
        0x2e1b2138,
        0x4d2c6dfc,
        0x53380d13,
        0x650a7354,
        0x766a0abb,
        0x81c2c92e,
        0x92722c85,
        0xa2bfe8a1,
        0xa81a664b,
        0xc24b8b70,
        0xc76c51a3,
        0xd192e819,
        0xd6990624,
        0xf40e3585,
        0x106aa070,
        0x19a4c116,
        0x1e376c08,
        0x2748774c,
        0x34b0bcb5,
        0x391c0cb3,
        0x4ed8aa4a,
        0x5b9cca4f,
        0x682e6ff3,
        0x748f82ee,
        0x78a5636f,
        0x84c87814,
        0x8cc70208,
        0x90befffa,
        0xa4506ceb,
        0xbef9a3f7,
        0xc67178f2
    ]);
    function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while(len >= 64){
            a = v[0];
            b = v[1];
            c = v[2];
            d = v[3];
            e = v[4];
            f = v[5];
            g = v[6];
            h = v[7];
            for(i = 0; i < 16; i++){
                j = pos + i * 4;
                w[i] = (p[j] & 0xff) << 24 | (p[j + 1] & 0xff) << 16 | (p[j + 2] & 0xff) << 8 | p[j + 3] & 0xff;
            }
            for(i = 16; i < 64; i++){
                u = w[i - 2];
                t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
                u = w[i - 15];
                t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
                w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
            }
            for(i = 0; i < 64; i++){
                t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i] + w[i] | 0) | 0) | 0;
                t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
                h = g;
                g = f;
                f = e;
                e = d + t1 | 0;
                d = c;
                c = b;
                b = a;
                a = t1 + t2 | 0;
            }
            v[0] += a;
            v[1] += b;
            v[2] += c;
            v[3] += d;
            v[4] += e;
            v[5] += f;
            v[6] += g;
            v[7] += h;
            pos += 64;
            len -= 64;
        }
        return pos;
    }
    // Hash implements SHA256 hash algorithm.
    var Hash = function() {
        function Hash() {
            this.digestLength = exports.digestLength;
            this.blockSize = exports.blockSize;
            // Note: Int32Array is used instead of Uint32Array for performance reasons.
            this.state = new Int32Array(8); // hash state
            this.temp = new Int32Array(64); // temporary state
            this.buffer = new Uint8Array(128); // buffer for data to hash
            this.bufferLength = 0; // number of bytes in buffer
            this.bytesHashed = 0; // number of total bytes hashed
            this.finished = false; // indicates whether the hash was finalized
            this.reset();
        }
        // Resets hash state making it possible
        // to re-use this instance to hash other data.
        Hash.prototype.reset = function() {
            this.state[0] = 0x6a09e667;
            this.state[1] = 0xbb67ae85;
            this.state[2] = 0x3c6ef372;
            this.state[3] = 0xa54ff53a;
            this.state[4] = 0x510e527f;
            this.state[5] = 0x9b05688c;
            this.state[6] = 0x1f83d9ab;
            this.state[7] = 0x5be0cd19;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
        };
        // Cleans internal buffers and re-initializes hash state.
        Hash.prototype.clean = function() {
            for(var i = 0; i < this.buffer.length; i++){
                this.buffer[i] = 0;
            }
            for(var i = 0; i < this.temp.length; i++){
                this.temp[i] = 0;
            }
            this.reset();
        };
        // Updates hash state with the given data.
        //
        // Optionally, length of the data can be specified to hash
        // fewer bytes than data.length.
        //
        // Throws error when trying to update already finalized hash:
        // instance must be reset to use it again.
        Hash.prototype.update = function(data, dataLength) {
            if (dataLength === void 0) {
                dataLength = data.length;
            }
            if (this.finished) {
                throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
                while(this.bufferLength < 64 && dataLength > 0){
                    this.buffer[this.bufferLength++] = data[dataPos++];
                    dataLength--;
                }
                if (this.bufferLength === 64) {
                    hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                    this.bufferLength = 0;
                }
            }
            if (dataLength >= 64) {
                dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
                dataLength %= 64;
            }
            while(dataLength > 0){
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
            }
            return this;
        };
        // Finalizes hash state and puts hash into out.
        //
        // If hash was already finalized, puts the same value.
        Hash.prototype.finish = function(out) {
            if (!this.finished) {
                var bytesHashed = this.bytesHashed;
                var left = this.bufferLength;
                var bitLenHi = bytesHashed / 0x20000000 | 0;
                var bitLenLo = bytesHashed << 3;
                var padLength = bytesHashed % 64 < 56 ? 64 : 128;
                this.buffer[left] = 0x80;
                for(var i = left + 1; i < padLength - 8; i++){
                    this.buffer[i] = 0;
                }
                this.buffer[padLength - 8] = bitLenHi >>> 24 & 0xff;
                this.buffer[padLength - 7] = bitLenHi >>> 16 & 0xff;
                this.buffer[padLength - 6] = bitLenHi >>> 8 & 0xff;
                this.buffer[padLength - 5] = bitLenHi >>> 0 & 0xff;
                this.buffer[padLength - 4] = bitLenLo >>> 24 & 0xff;
                this.buffer[padLength - 3] = bitLenLo >>> 16 & 0xff;
                this.buffer[padLength - 2] = bitLenLo >>> 8 & 0xff;
                this.buffer[padLength - 1] = bitLenLo >>> 0 & 0xff;
                hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
                this.finished = true;
            }
            for(var i = 0; i < 8; i++){
                out[i * 4 + 0] = this.state[i] >>> 24 & 0xff;
                out[i * 4 + 1] = this.state[i] >>> 16 & 0xff;
                out[i * 4 + 2] = this.state[i] >>> 8 & 0xff;
                out[i * 4 + 3] = this.state[i] >>> 0 & 0xff;
            }
            return this;
        };
        // Returns the final hash digest.
        Hash.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
        };
        // Internal function for use in HMAC for optimization.
        Hash.prototype._saveState = function(out) {
            for(var i = 0; i < this.state.length; i++){
                out[i] = this.state[i];
            }
        };
        // Internal function for use in HMAC for optimization.
        Hash.prototype._restoreState = function(from, bytesHashed) {
            for(var i = 0; i < this.state.length; i++){
                this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
        };
        return Hash;
    }();
    exports.Hash = Hash;
    // HMAC implements HMAC-SHA256 message authentication algorithm.
    var HMAC = function() {
        function HMAC(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
                new Hash().update(key).finish(pad).clean();
            } else {
                for(var i = 0; i < key.length; i++){
                    pad[i] = key[i];
                }
            }
            for(var i = 0; i < pad.length; i++){
                pad[i] ^= 0x36;
            }
            this.inner.update(pad);
            for(var i = 0; i < pad.length; i++){
                pad[i] ^= 0x36 ^ 0x5c;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for(var i = 0; i < pad.length; i++){
                pad[i] = 0;
            }
        }
        // Returns HMAC state to the state initialized with key
        // to make it possible to run HMAC over the other data with the same
        // key without creating a new instance.
        HMAC.prototype.reset = function() {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
        };
        // Cleans HMAC state.
        HMAC.prototype.clean = function() {
            for(var i = 0; i < this.istate.length; i++){
                this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
        };
        // Updates state with provided data.
        HMAC.prototype.update = function(data) {
            this.inner.update(data);
            return this;
        };
        // Finalizes HMAC and puts the result in out.
        HMAC.prototype.finish = function(out) {
            if (this.outer.finished) {
                this.outer.finish(out);
            } else {
                this.inner.finish(out);
                this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
        };
        // Returns message authentication code.
        HMAC.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
        };
        return HMAC;
    }();
    exports.HMAC = HMAC;
    // Returns SHA256 hash of data.
    function hash(data) {
        var h = new Hash().update(data);
        var digest = h.digest();
        h.clean();
        return digest;
    }
    exports.hash = hash;
    // Function hash is both available as module.hash and as default export.
    exports["default"] = hash;
    // Returns HMAC-SHA256 of data under the key.
    function hmac(key, data) {
        var h = new HMAC(key).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
    }
    exports.hmac = hmac;
    // Fills hkdf buffer like this:
    // T(1) = HMAC-Hash(PRK, T(0) | info | 0x01)
    function fillBuffer(buffer, hmac, info, counter) {
        // Counter is a byte value: check if it overflowed.
        var num = counter[0];
        if (num === 0) {
            throw new Error("hkdf: cannot expand more");
        }
        // Prepare HMAC instance for new data with old key.
        hmac.reset();
        // Hash in previous output if it was generated
        // (i.e. counter is greater than 1).
        if (num > 1) {
            hmac.update(buffer);
        }
        // Hash in info if it exists.
        if (info) {
            hmac.update(info);
        }
        // Hash in the counter.
        hmac.update(counter);
        // Output result to buffer and clean HMAC instance.
        hmac.finish(buffer);
        // Increment counter inside typed array, this works properly.
        counter[0]++;
    }
    var hkdfSalt = new Uint8Array(exports.digestLength); // Filled with zeroes.
    function hkdf(key, salt, info, length) {
        if (salt === void 0) {
            salt = hkdfSalt;
        }
        if (length === void 0) {
            length = 32;
        }
        var counter = new Uint8Array([
            1
        ]);
        // HKDF-Extract uses salt as HMAC key, and key as data.
        var okm = hmac(salt, key);
        // Initialize HMAC for expanding with extracted key.
        // Ensure no collisions with `hmac` function.
        var hmac_ = new HMAC(okm);
        // Allocate buffer.
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for(var i = 0; i < length; i++){
            if (bufpos === buffer.length) {
                fillBuffer(buffer, hmac_, info, counter);
                bufpos = 0;
            }
            out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
    }
    exports.hkdf = hkdf;
    // Derives a key from password and salt using PBKDF2-HMAC-SHA256
    // with the given number of iterations.
    //
    // The number of bytes returned is equal to dkLen.
    //
    // (For better security, avoid dkLen greater than hash length - 32 bytes).
    function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for(var i = 0; i * len < dkLen; i++){
            var c = i + 1;
            ctr[0] = c >>> 24 & 0xff;
            ctr[1] = c >>> 16 & 0xff;
            ctr[2] = c >>> 8 & 0xff;
            ctr[3] = c >>> 0 & 0xff;
            prf.reset();
            prf.update(salt);
            prf.update(ctr);
            prf.finish(u);
            for(var j = 0; j < len; j++){
                t[j] = u[j];
            }
            for(var j = 2; j <= iterations; j++){
                prf.reset();
                prf.update(u).finish(u);
                for(var k = 0; k < len; k++){
                    t[k] ^= u[k];
                }
            }
            for(var j = 0; j < len && i * len + j < dkLen; j++){
                dk[i * len + j] = t[j];
            }
        }
        for(var i = 0; i < len; i++){
            t[i] = u[i] = 0;
        }
        for(var i = 0; i < 4; i++){
            ctr[i] = 0;
        }
        prf.clean();
        return dk;
    }
    exports.pbkdf2 = pbkdf2;
});
}),
"[project]/node_modules/standardwebhooks/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Webhook = exports.WebhookVerificationError = void 0;
const timing_safe_equal_1 = __turbopack_context__.r("[project]/node_modules/standardwebhooks/dist/timing_safe_equal.js [app-rsc] (ecmascript)");
const base64 = __turbopack_context__.r("[project]/node_modules/@stablelib/base64/lib/base64.js [app-rsc] (ecmascript)");
const sha256 = __turbopack_context__.r("[project]/node_modules/fast-sha256/sha256.js [app-rsc] (ecmascript)");
const WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
class ExtendableError extends Error {
    constructor(message){
        super(message);
        Object.setPrototypeOf(this, ExtendableError.prototype);
        this.name = "ExtendableError";
        this.stack = new Error(message).stack;
    }
}
class WebhookVerificationError extends ExtendableError {
    constructor(message){
        super(message);
        Object.setPrototypeOf(this, WebhookVerificationError.prototype);
        this.name = "WebhookVerificationError";
    }
}
exports.WebhookVerificationError = WebhookVerificationError;
class Webhook {
    constructor(secret, options){
        if (!secret) {
            throw new Error("Secret can't be empty.");
        }
        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
            if (secret instanceof Uint8Array) {
                this.key = secret;
            } else {
                this.key = Uint8Array.from(secret, (c)=>c.charCodeAt(0));
            }
        } else {
            if (typeof secret !== "string") {
                throw new Error("Expected secret to be of type string");
            }
            if (secret.startsWith(Webhook.prefix)) {
                secret = secret.substring(Webhook.prefix.length);
            }
            this.key = base64.decode(secret);
        }
    }
    verify(payload, headers_) {
        const headers = {};
        for (const key of Object.keys(headers_)){
            headers[key.toLowerCase()] = headers_[key];
        }
        const msgId = headers["webhook-id"];
        const msgSignature = headers["webhook-signature"];
        const msgTimestamp = headers["webhook-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
            throw new WebhookVerificationError("Missing required headers");
        }
        const timestamp = this.verifyTimestamp(msgTimestamp);
        const computedSignature = this.sign(msgId, timestamp, payload);
        const expectedSignature = computedSignature.split(",")[1];
        const passedSignatures = msgSignature.split(" ");
        const encoder = new globalThis.TextEncoder();
        for (const versionedSignature of passedSignatures){
            const [version, signature] = versionedSignature.split(",");
            if (version !== "v1") {
                continue;
            }
            if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
                return JSON.parse(payload.toString());
            }
        }
        throw new WebhookVerificationError("No matching signature found");
    }
    sign(msgId, timestamp, payload) {
        if (typeof payload === "string") {} else if (payload.constructor.name === "Buffer") {
            payload = payload.toString();
        } else {
            throw new Error("Expected payload to be of type string or Buffer.");
        }
        const encoder = new TextEncoder();
        const timestampNumber = Math.floor(timestamp.getTime() / 1000);
        const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
        const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
        return `v1,${expectedSignature}`;
    }
    verifyTimestamp(timestampHeader) {
        const now = Math.floor(Date.now() / 1000);
        const timestamp = parseInt(timestampHeader, 10);
        if (isNaN(timestamp)) {
            throw new WebhookVerificationError("Invalid Signature Headers");
        }
        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
            throw new WebhookVerificationError("Message timestamp too old");
        }
        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
            throw new WebhookVerificationError("Message timestamp too new");
        }
        return new Date(timestamp * 1000);
    }
}
exports.Webhook = Webhook;
Webhook.prefix = "whsec_"; //# sourceMappingURL=index.js.map
}),
"[project]/node_modules/svix/dist/webhook.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Webhook = exports.WebhookVerificationError = void 0;
const standardwebhooks_1 = __turbopack_context__.r("[project]/node_modules/standardwebhooks/dist/index.js [app-rsc] (ecmascript)");
var standardwebhooks_2 = __turbopack_context__.r("[project]/node_modules/standardwebhooks/dist/index.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "WebhookVerificationError", {
    enumerable: true,
    get: function() {
        return standardwebhooks_2.WebhookVerificationError;
    }
});
class Webhook {
    constructor(secret, options){
        this.inner = new standardwebhooks_1.Webhook(secret, options);
    }
    verify(payload, headers_) {
        var _a, _b, _c, _d, _e, _f;
        const headers = {};
        for (const key of Object.keys(headers_)){
            headers[key.toLowerCase()] = headers_[key];
        }
        headers["webhook-id"] = (_b = (_a = headers["svix-id"]) !== null && _a !== void 0 ? _a : headers["webhook-id"]) !== null && _b !== void 0 ? _b : "";
        headers["webhook-signature"] = (_d = (_c = headers["svix-signature"]) !== null && _c !== void 0 ? _c : headers["webhook-signature"]) !== null && _d !== void 0 ? _d : "";
        headers["webhook-timestamp"] = (_f = (_e = headers["svix-timestamp"]) !== null && _e !== void 0 ? _e : headers["webhook-timestamp"]) !== null && _f !== void 0 ? _f : "";
        return this.inner.verify(payload, headers);
    }
    sign(msgId, timestamp, payload) {
        return this.inner.sign(msgId, timestamp, payload);
    }
}
exports.Webhook = Webhook; //# sourceMappingURL=webhook.js.map
}),
"[project]/node_modules/svix/dist/models/endpointDisabledTrigger.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EndpointDisabledTriggerSerializer = exports.EndpointDisabledTrigger = void 0;
var EndpointDisabledTrigger;
(function(EndpointDisabledTrigger) {
    EndpointDisabledTrigger["Manual"] = "manual";
    EndpointDisabledTrigger["Automatic"] = "automatic";
})(EndpointDisabledTrigger = exports.EndpointDisabledTrigger || (exports.EndpointDisabledTrigger = {}));
exports.EndpointDisabledTriggerSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=endpointDisabledTrigger.js.map
}),
"[project]/node_modules/svix/dist/models/ordering.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OrderingSerializer = exports.Ordering = void 0;
var Ordering;
(function(Ordering) {
    Ordering["Ascending"] = "ascending";
    Ordering["Descending"] = "descending";
})(Ordering = exports.Ordering || (exports.Ordering = {}));
exports.OrderingSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=ordering.js.map
}),
"[project]/node_modules/svix/dist/models/statusCodeClass.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusCodeClassSerializer = exports.StatusCodeClass = void 0;
var StatusCodeClass;
(function(StatusCodeClass) {
    StatusCodeClass[StatusCodeClass["CodeNone"] = 0] = "CodeNone";
    StatusCodeClass[StatusCodeClass["Code1xx"] = 100] = "Code1xx";
    StatusCodeClass[StatusCodeClass["Code2xx"] = 200] = "Code2xx";
    StatusCodeClass[StatusCodeClass["Code3xx"] = 300] = "Code3xx";
    StatusCodeClass[StatusCodeClass["Code4xx"] = 400] = "Code4xx";
    StatusCodeClass[StatusCodeClass["Code5xx"] = 500] = "Code5xx";
})(StatusCodeClass = exports.StatusCodeClass || (exports.StatusCodeClass = {}));
exports.StatusCodeClassSerializer = {
    _fromJsonObject (object) {
        return object;
    },
    _toJsonObject (self) {
        return self;
    }
}; //# sourceMappingURL=statusCodeClass.js.map
}),
"[project]/node_modules/svix/dist/models/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusCodeClass = exports.SinkStatusIn = exports.SinkStatus = exports.Ordering = exports.MessageStatusText = exports.MessageStatus = exports.MessageAttemptTriggerType = exports.EndpointDisabledTrigger = exports.ConnectorProduct = exports.ConnectorKind = exports.BackgroundTaskType = exports.BackgroundTaskStatus = exports.AppPortalCapability = void 0;
var appPortalCapability_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/appPortalCapability.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "AppPortalCapability", {
    enumerable: true,
    get: function() {
        return appPortalCapability_1.AppPortalCapability;
    }
});
var backgroundTaskStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskStatus.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "BackgroundTaskStatus", {
    enumerable: true,
    get: function() {
        return backgroundTaskStatus_1.BackgroundTaskStatus;
    }
});
var backgroundTaskType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/backgroundTaskType.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "BackgroundTaskType", {
    enumerable: true,
    get: function() {
        return backgroundTaskType_1.BackgroundTaskType;
    }
});
var connectorKind_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorKind.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "ConnectorKind", {
    enumerable: true,
    get: function() {
        return connectorKind_1.ConnectorKind;
    }
});
var connectorProduct_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/connectorProduct.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "ConnectorProduct", {
    enumerable: true,
    get: function() {
        return connectorProduct_1.ConnectorProduct;
    }
});
var endpointDisabledTrigger_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/endpointDisabledTrigger.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "EndpointDisabledTrigger", {
    enumerable: true,
    get: function() {
        return endpointDisabledTrigger_1.EndpointDisabledTrigger;
    }
});
var messageAttemptTriggerType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageAttemptTriggerType.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "MessageAttemptTriggerType", {
    enumerable: true,
    get: function() {
        return messageAttemptTriggerType_1.MessageAttemptTriggerType;
    }
});
var messageStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatus.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "MessageStatus", {
    enumerable: true,
    get: function() {
        return messageStatus_1.MessageStatus;
    }
});
var messageStatusText_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/messageStatusText.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "MessageStatusText", {
    enumerable: true,
    get: function() {
        return messageStatusText_1.MessageStatusText;
    }
});
var ordering_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/ordering.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "Ordering", {
    enumerable: true,
    get: function() {
        return ordering_1.Ordering;
    }
});
var sinkStatus_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkStatus.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "SinkStatus", {
    enumerable: true,
    get: function() {
        return sinkStatus_1.SinkStatus;
    }
});
var sinkStatusIn_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/sinkStatusIn.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "SinkStatusIn", {
    enumerable: true,
    get: function() {
        return sinkStatusIn_1.SinkStatusIn;
    }
});
var statusCodeClass_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/models/statusCodeClass.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "StatusCodeClass", {
    enumerable: true,
    get: function() {
        return statusCodeClass_1.StatusCodeClass;
    }
}); //# sourceMappingURL=index.js.map
}),
"[project]/node_modules/svix/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Svix = exports.messageInRaw = exports.ValidationError = exports.HttpErrorOut = exports.HTTPValidationError = exports.ApiException = void 0;
const application_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/application.js [app-rsc] (ecmascript)");
const authentication_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/authentication.js [app-rsc] (ecmascript)");
const backgroundTask_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/backgroundTask.js [app-rsc] (ecmascript)");
const connector_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/connector.js [app-rsc] (ecmascript)");
const endpoint_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/endpoint.js [app-rsc] (ecmascript)");
const environment_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/environment.js [app-rsc] (ecmascript)");
const eventType_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/eventType.js [app-rsc] (ecmascript)");
const health_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/health.js [app-rsc] (ecmascript)");
const ingest_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/ingest.js [app-rsc] (ecmascript)");
const integration_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/integration.js [app-rsc] (ecmascript)");
const message_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/message.js [app-rsc] (ecmascript)");
const messageAttempt_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/messageAttempt.js [app-rsc] (ecmascript)");
const operationalWebhook_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/operationalWebhook.js [app-rsc] (ecmascript)");
const statistics_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/statistics.js [app-rsc] (ecmascript)");
const streaming_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/streaming.js [app-rsc] (ecmascript)");
const operationalWebhookEndpoint_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/operationalWebhookEndpoint.js [app-rsc] (ecmascript)");
var util_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/util.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "ApiException", {
    enumerable: true,
    get: function() {
        return util_1.ApiException;
    }
});
var HttpErrors_1 = __turbopack_context__.r("[project]/node_modules/svix/dist/HttpErrors.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "HTTPValidationError", {
    enumerable: true,
    get: function() {
        return HttpErrors_1.HTTPValidationError;
    }
});
Object.defineProperty(exports, "HttpErrorOut", {
    enumerable: true,
    get: function() {
        return HttpErrors_1.HttpErrorOut;
    }
});
Object.defineProperty(exports, "ValidationError", {
    enumerable: true,
    get: function() {
        return HttpErrors_1.ValidationError;
    }
});
__exportStar(__turbopack_context__.r("[project]/node_modules/svix/dist/webhook.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/svix/dist/models/index.js [app-rsc] (ecmascript)"), exports);
var message_2 = __turbopack_context__.r("[project]/node_modules/svix/dist/api/message.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "messageInRaw", {
    enumerable: true,
    get: function() {
        return message_2.messageInRaw;
    }
});
const REGIONS = [
    {
        region: "us",
        url: "https://api.us.svix.com"
    },
    {
        region: "eu",
        url: "https://api.eu.svix.com"
    },
    {
        region: "in",
        url: "https://api.in.svix.com"
    },
    {
        region: "ca",
        url: "https://api.ca.svix.com"
    },
    {
        region: "au",
        url: "https://api.au.svix.com"
    }
];
class Svix {
    constructor(token, options = {}){
        var _a, _b, _c;
        const regionalUrl = (_a = REGIONS.find((x)=>x.region === token.split(".")[1])) === null || _a === void 0 ? void 0 : _a.url;
        const baseUrl = (_c = (_b = options.serverUrl) !== null && _b !== void 0 ? _b : regionalUrl) !== null && _c !== void 0 ? _c : "https://api.svix.com";
        if (options.retryScheduleInMs) {
            this.requestCtx = {
                baseUrl,
                token,
                timeout: options.requestTimeout,
                retryScheduleInMs: options.retryScheduleInMs,
                fetch: options.fetch
            };
            return;
        }
        if (options.numRetries) {
            this.requestCtx = {
                baseUrl,
                token,
                timeout: options.requestTimeout,
                numRetries: options.numRetries,
                fetch: options.fetch
            };
            return;
        }
        this.requestCtx = {
            baseUrl,
            token,
            timeout: options.requestTimeout,
            fetch: options.fetch
        };
    }
    get application() {
        return new application_1.Application(this.requestCtx);
    }
    get authentication() {
        return new authentication_1.Authentication(this.requestCtx);
    }
    get backgroundTask() {
        return new backgroundTask_1.BackgroundTask(this.requestCtx);
    }
    get connector() {
        return new connector_1.Connector(this.requestCtx);
    }
    get endpoint() {
        return new endpoint_1.Endpoint(this.requestCtx);
    }
    get environment() {
        return new environment_1.Environment(this.requestCtx);
    }
    get eventType() {
        return new eventType_1.EventType(this.requestCtx);
    }
    get health() {
        return new health_1.Health(this.requestCtx);
    }
    get ingest() {
        return new ingest_1.Ingest(this.requestCtx);
    }
    get integration() {
        return new integration_1.Integration(this.requestCtx);
    }
    get message() {
        return new message_1.Message(this.requestCtx);
    }
    get messageAttempt() {
        return new messageAttempt_1.MessageAttempt(this.requestCtx);
    }
    get operationalWebhook() {
        return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
    }
    get statistics() {
        return new statistics_1.Statistics(this.requestCtx);
    }
    get streaming() {
        return new streaming_1.Streaming(this.requestCtx);
    }
    get operationalWebhookEndpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
}
exports.Svix = Svix; //# sourceMappingURL=index.js.map
}),
"[project]/node_modules/resend/dist/index.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Resend",
    ()=>Resend
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$svix$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/svix/dist/index.js [app-rsc] (ecmascript)");
;
//#region package.json
var version = "6.7.0";
//#endregion
//#region src/common/utils/build-pagination-query.ts
/**
* Builds a query string from pagination options
* @param options - Pagination options containing limit and either after or before (but not both)
* @returns Query string (without leading '?') or empty string if no options
*/ function buildPaginationQuery(options) {
    const searchParams = new URLSearchParams();
    if (options.limit !== void 0) searchParams.set("limit", options.limit.toString());
    if ("after" in options && options.after !== void 0) searchParams.set("after", options.after);
    if ("before" in options && options.before !== void 0) searchParams.set("before", options.before);
    return searchParams.toString();
}
//#endregion
//#region src/api-keys/api-keys.ts
var ApiKeys = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload, options = {}) {
        return await this.resend.post("/api-keys", payload, options);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
        return await this.resend.get(url);
    }
    async remove(id) {
        return await this.resend.delete(`/api-keys/${id}`);
    }
};
//#endregion
//#region src/common/utils/parse-email-to-api-options.ts
function parseAttachments(attachments) {
    return attachments?.map((attachment)=>({
            content: attachment.content,
            filename: attachment.filename,
            path: attachment.path,
            content_type: attachment.contentType,
            content_id: attachment.contentId
        }));
}
function parseEmailToApiOptions(email) {
    return {
        attachments: parseAttachments(email.attachments),
        bcc: email.bcc,
        cc: email.cc,
        from: email.from,
        headers: email.headers,
        html: email.html,
        reply_to: email.replyTo,
        scheduled_at: email.scheduledAt,
        subject: email.subject,
        tags: email.tags,
        text: email.text,
        to: email.to,
        template: email.template ? {
            id: email.template.id,
            variables: email.template.variables
        } : void 0,
        topic_id: email.topicId
    };
}
//#endregion
//#region src/render.ts
async function render(node) {
    let render$1;
    try {
        ({ render: render$1 } = await (()=>{
            const e = new Error("Cannot find module '@react-email/render'");
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        })());
    } catch  {
        throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
    }
    return render$1(node);
}
//#endregion
//#region src/batch/batch.ts
var Batch = class {
    constructor(resend){
        this.resend = resend;
    }
    async send(payload, options) {
        return this.create(payload, options);
    }
    async create(payload, options) {
        const emails = [];
        for (const email of payload){
            if (email.react) {
                email.html = await render(email.react);
                email.react = void 0;
            }
            emails.push(parseEmailToApiOptions(email));
        }
        return await this.resend.post("/emails/batch", emails, {
            ...options,
            headers: {
                "x-batch-validation": options?.batchValidation ?? "strict",
                ...options?.headers
            }
        });
    }
};
//#endregion
//#region src/broadcasts/broadcasts.ts
var Broadcasts = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload, options = {}) {
        if (payload.react) payload.html = await render(payload.react);
        return await this.resend.post("/broadcasts", {
            name: payload.name,
            segment_id: payload.segmentId,
            audience_id: payload.audienceId,
            preview_text: payload.previewText,
            from: payload.from,
            html: payload.html,
            reply_to: payload.replyTo,
            subject: payload.subject,
            text: payload.text,
            topic_id: payload.topicId
        }, options);
    }
    async send(id, payload) {
        return await this.resend.post(`/broadcasts/${id}/send`, {
            scheduled_at: payload?.scheduledAt
        });
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
        return await this.resend.get(url);
    }
    async get(id) {
        return await this.resend.get(`/broadcasts/${id}`);
    }
    async remove(id) {
        return await this.resend.delete(`/broadcasts/${id}`);
    }
    async update(id, payload) {
        if (payload.react) payload.html = await render(payload.react);
        return await this.resend.patch(`/broadcasts/${id}`, {
            name: payload.name,
            segment_id: payload.segmentId,
            audience_id: payload.audienceId,
            from: payload.from,
            html: payload.html,
            text: payload.text,
            subject: payload.subject,
            reply_to: payload.replyTo,
            preview_text: payload.previewText,
            topic_id: payload.topicId
        });
    }
};
//#endregion
//#region src/common/utils/parse-contact-properties-to-api-options.ts
function parseContactPropertyFromApi(contactProperty) {
    return {
        id: contactProperty.id,
        key: contactProperty.key,
        createdAt: contactProperty.created_at,
        type: contactProperty.type,
        fallbackValue: contactProperty.fallback_value
    };
}
function parseContactPropertyToApiOptions(contactProperty) {
    if ("key" in contactProperty) return {
        key: contactProperty.key,
        type: contactProperty.type,
        fallback_value: contactProperty.fallbackValue
    };
    return {
        fallback_value: contactProperty.fallbackValue
    };
}
//#endregion
//#region src/contact-properties/contact-properties.ts
var ContactProperties = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(options) {
        const apiOptions = parseContactPropertyToApiOptions(options);
        return await this.resend.post("/contact-properties", apiOptions);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
        const response = await this.resend.get(url);
        if (response.data) return {
            data: {
                ...response.data,
                data: response.data.data.map((apiContactProperty)=>parseContactPropertyFromApi(apiContactProperty))
            },
            headers: response.headers,
            error: null
        };
        return response;
    }
    async get(id) {
        if (!id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const response = await this.resend.get(`/contact-properties/${id}`);
        if (response.data) return {
            data: {
                object: "contact_property",
                ...parseContactPropertyFromApi(response.data)
            },
            headers: response.headers,
            error: null
        };
        return response;
    }
    async update(payload) {
        if (!payload.id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const apiOptions = parseContactPropertyToApiOptions(payload);
        return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
    }
    async remove(id) {
        if (!id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        return await this.resend.delete(`/contact-properties/${id}`);
    }
};
//#endregion
//#region src/contacts/segments/contact-segments.ts
var ContactSegments = class {
    constructor(resend){
        this.resend = resend;
    }
    async list(options) {
        if (!options.contactId && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const identifier = options.email ? options.email : options.contactId;
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
        return await this.resend.get(url);
    }
    async add(options) {
        if (!options.contactId && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const identifier = options.email ? options.email : options.contactId;
        return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
    }
    async remove(options) {
        if (!options.contactId && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const identifier = options.email ? options.email : options.contactId;
        return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
    }
};
//#endregion
//#region src/contacts/topics/contact-topics.ts
var ContactTopics = class {
    constructor(resend){
        this.resend = resend;
    }
    async update(payload) {
        if (!payload.id && !payload.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const identifier = payload.email ? payload.email : payload.id;
        return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
    }
    async list(options) {
        if (!options.id && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        const identifier = options.email ? options.email : options.id;
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
        return this.resend.get(url);
    }
};
//#endregion
//#region src/contacts/contacts.ts
var Contacts = class {
    constructor(resend){
        this.resend = resend;
        this.topics = new ContactTopics(this.resend);
        this.segments = new ContactSegments(this.resend);
    }
    async create(payload, options = {}) {
        if (!payload.audienceId) return await this.resend.post("/contacts", {
            unsubscribed: payload.unsubscribed,
            email: payload.email,
            first_name: payload.firstName,
            last_name: payload.lastName,
            properties: payload.properties
        }, options);
        return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
            unsubscribed: payload.unsubscribed,
            email: payload.email,
            first_name: payload.firstName,
            last_name: payload.lastName,
            properties: payload.properties
        }, options);
    }
    async list(options = {}) {
        const segmentId = options.segmentId ?? options.audienceId;
        if (!segmentId) {
            const queryString$1 = buildPaginationQuery(options);
            const url$1 = queryString$1 ? `/contacts?${queryString$1}` : "/contacts";
            return await this.resend.get(url$1);
        }
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
        return await this.resend.get(url);
    }
    async get(options) {
        if (typeof options === "string") return this.resend.get(`/contacts/${options}`);
        if (!options.id && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        if (!options.audienceId) return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
        return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
    }
    async update(options) {
        if (!options.id && !options.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        if (!options.audienceId) return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
            unsubscribed: options.unsubscribed,
            first_name: options.firstName,
            last_name: options.lastName,
            properties: options.properties
        });
        return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
            unsubscribed: options.unsubscribed,
            first_name: options.firstName,
            last_name: options.lastName,
            properties: options.properties
        });
    }
    async remove(payload) {
        if (typeof payload === "string") return this.resend.delete(`/contacts/${payload}`);
        if (!payload.id && !payload.email) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` or `email` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        if (!payload.audienceId) return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
        return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
    }
};
//#endregion
//#region src/common/utils/parse-domain-to-api-options.ts
function parseDomainToApiOptions(domain) {
    return {
        name: domain.name,
        region: domain.region,
        custom_return_path: domain.customReturnPath,
        capabilities: domain.capabilities,
        open_tracking: domain.openTracking,
        click_tracking: domain.clickTracking,
        tls: domain.tls
    };
}
//#endregion
//#region src/domains/domains.ts
var Domains = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload, options = {}) {
        return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/domains?${queryString}` : "/domains";
        return await this.resend.get(url);
    }
    async get(id) {
        return await this.resend.get(`/domains/${id}`);
    }
    async update(payload) {
        return await this.resend.patch(`/domains/${payload.id}`, {
            click_tracking: payload.clickTracking,
            open_tracking: payload.openTracking,
            tls: payload.tls,
            capabilities: payload.capabilities
        });
    }
    async remove(id) {
        return await this.resend.delete(`/domains/${id}`);
    }
    async verify(id) {
        return await this.resend.post(`/domains/${id}/verify`);
    }
};
//#endregion
//#region src/emails/attachments/attachments.ts
var Attachments$1 = class {
    constructor(resend){
        this.resend = resend;
    }
    async get(options) {
        const { emailId, id } = options;
        return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
    }
    async list(options) {
        const { emailId } = options;
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
        return await this.resend.get(url);
    }
};
//#endregion
//#region src/emails/receiving/attachments/attachments.ts
var Attachments = class {
    constructor(resend){
        this.resend = resend;
    }
    async get(options) {
        const { emailId, id } = options;
        return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
    }
    async list(options) {
        const { emailId } = options;
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
        return await this.resend.get(url);
    }
};
//#endregion
//#region src/emails/receiving/receiving.ts
var Receiving = class {
    constructor(resend){
        this.resend = resend;
        this.attachments = new Attachments(resend);
    }
    async get(id) {
        return await this.resend.get(`/emails/receiving/${id}`);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
        return await this.resend.get(url);
    }
};
//#endregion
//#region src/emails/emails.ts
var Emails = class {
    constructor(resend){
        this.resend = resend;
        this.attachments = new Attachments$1(resend);
        this.receiving = new Receiving(resend);
    }
    async send(payload, options = {}) {
        return this.create(payload, options);
    }
    async create(payload, options = {}) {
        if (payload.react) payload.html = await render(payload.react);
        return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
    }
    async get(id) {
        return await this.resend.get(`/emails/${id}`);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/emails?${queryString}` : "/emails";
        return await this.resend.get(url);
    }
    async update(payload) {
        return await this.resend.patch(`/emails/${payload.id}`, {
            scheduled_at: payload.scheduledAt
        });
    }
    async cancel(id) {
        return await this.resend.post(`/emails/${id}/cancel`);
    }
};
//#endregion
//#region src/segments/segments.ts
var Segments = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload, options = {}) {
        return await this.resend.post("/segments", payload, options);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/segments?${queryString}` : "/segments";
        return await this.resend.get(url);
    }
    async get(id) {
        return await this.resend.get(`/segments/${id}`);
    }
    async remove(id) {
        return await this.resend.delete(`/segments/${id}`);
    }
};
//#endregion
//#region src/common/utils/get-pagination-query-properties.ts
function getPaginationQueryProperties(options = {}) {
    const query = new URLSearchParams();
    if (options.before) query.set("before", options.before);
    if (options.after) query.set("after", options.after);
    if (options.limit) query.set("limit", options.limit.toString());
    return query.size > 0 ? `?${query.toString()}` : "";
}
//#endregion
//#region src/common/utils/parse-template-to-api-options.ts
function parseVariables(variables) {
    return variables?.map((variable)=>({
            key: variable.key,
            type: variable.type,
            fallback_value: variable.fallbackValue
        }));
}
function parseTemplateToApiOptions(template) {
    return {
        name: "name" in template ? template.name : void 0,
        subject: template.subject,
        html: template.html,
        text: template.text,
        alias: template.alias,
        from: template.from,
        reply_to: template.replyTo,
        variables: parseVariables(template.variables)
    };
}
//#endregion
//#region src/templates/chainable-template-result.ts
var ChainableTemplateResult = class {
    constructor(promise, publishFn){
        this.promise = promise;
        this.publishFn = publishFn;
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    async publish() {
        const { data, error } = await this.promise;
        if (error) return {
            data: null,
            headers: null,
            error
        };
        return this.publishFn(data.id);
    }
};
//#endregion
//#region src/templates/templates.ts
var Templates = class {
    constructor(resend){
        this.resend = resend;
    }
    create(payload) {
        return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
    }
    async performCreate(payload) {
        if (payload.react) {
            if (!this.renderAsync) try {
                const { renderAsync } = await (()=>{
                    const e = new Error("Cannot find module '@react-email/render'");
                    e.code = 'MODULE_NOT_FOUND';
                    throw e;
                })();
                this.renderAsync = renderAsync;
            } catch  {
                throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
            }
            payload.html = await this.renderAsync(payload.react);
        }
        return this.resend.post("/templates", parseTemplateToApiOptions(payload));
    }
    async remove(identifier) {
        return await this.resend.delete(`/templates/${identifier}`);
    }
    async get(identifier) {
        return await this.resend.get(`/templates/${identifier}`);
    }
    async list(options = {}) {
        return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
    }
    duplicate(identifier) {
        return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
    }
    async publish(identifier) {
        return await this.resend.post(`/templates/${identifier}/publish`);
    }
    async update(identifier, payload) {
        return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
    }
};
//#endregion
//#region src/topics/topics.ts
var Topics = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload) {
        const { defaultSubscription, ...body } = payload;
        return await this.resend.post("/topics", {
            ...body,
            default_subscription: defaultSubscription
        });
    }
    async list() {
        return await this.resend.get("/topics");
    }
    async get(id) {
        if (!id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        return await this.resend.get(`/topics/${id}`);
    }
    async update(payload) {
        if (!payload.id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        return await this.resend.patch(`/topics/${payload.id}`, payload);
    }
    async remove(id) {
        if (!id) return {
            data: null,
            headers: null,
            error: {
                message: "Missing `id` field.",
                statusCode: null,
                name: "missing_required_field"
            }
        };
        return await this.resend.delete(`/topics/${id}`);
    }
};
//#endregion
//#region src/webhooks/webhooks.ts
var Webhooks = class {
    constructor(resend){
        this.resend = resend;
    }
    async create(payload, options = {}) {
        return await this.resend.post("/webhooks", payload, options);
    }
    async get(id) {
        return await this.resend.get(`/webhooks/${id}`);
    }
    async list(options = {}) {
        const queryString = buildPaginationQuery(options);
        const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
        return await this.resend.get(url);
    }
    async update(id, payload) {
        return await this.resend.patch(`/webhooks/${id}`, payload);
    }
    async remove(id) {
        return await this.resend.delete(`/webhooks/${id}`);
    }
    verify(payload) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$svix$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Webhook"](payload.webhookSecret).verify(payload.payload, {
            "svix-id": payload.headers.id,
            "svix-timestamp": payload.headers.timestamp,
            "svix-signature": payload.headers.signature
        });
    }
};
//#endregion
//#region src/resend.ts
const defaultBaseUrl = "https://api.resend.com";
const defaultUserAgent = `resend-node:${version}`;
const baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
const userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
    constructor(key){
        this.key = key;
        this.apiKeys = new ApiKeys(this);
        this.segments = new Segments(this);
        this.audiences = this.segments;
        this.batch = new Batch(this);
        this.broadcasts = new Broadcasts(this);
        this.contacts = new Contacts(this);
        this.contactProperties = new ContactProperties(this);
        this.domains = new Domains(this);
        this.emails = new Emails(this);
        this.webhooks = new Webhooks(this);
        this.templates = new Templates(this);
        this.topics = new Topics(this);
        if (!key) {
            if (typeof process !== "undefined" && process.env) this.key = process.env.RESEND_API_KEY;
            if (!this.key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
        }
        this.headers = new Headers({
            Authorization: `Bearer ${this.key}`,
            "User-Agent": userAgent,
            "Content-Type": "application/json"
        });
    }
    async fetchRequest(path, options = {}) {
        try {
            const response = await fetch(`${baseUrl}${path}`, options);
            if (!response.ok) try {
                const rawError = await response.text();
                return {
                    data: null,
                    error: JSON.parse(rawError),
                    headers: Object.fromEntries(response.headers.entries())
                };
            } catch (err) {
                if (err instanceof SyntaxError) return {
                    data: null,
                    error: {
                        name: "application_error",
                        statusCode: response.status,
                        message: "Internal server error. We are unable to process your request right now, please try again later."
                    },
                    headers: Object.fromEntries(response.headers.entries())
                };
                const error = {
                    message: response.statusText,
                    statusCode: response.status,
                    name: "application_error"
                };
                if (err instanceof Error) return {
                    data: null,
                    error: {
                        ...error,
                        message: err.message
                    },
                    headers: Object.fromEntries(response.headers.entries())
                };
                return {
                    data: null,
                    error,
                    headers: Object.fromEntries(response.headers.entries())
                };
            }
            return {
                data: await response.json(),
                error: null,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch  {
            return {
                data: null,
                error: {
                    name: "application_error",
                    statusCode: null,
                    message: "Unable to fetch data. The request could not be resolved."
                },
                headers: null
            };
        }
    }
    async post(path, entity, options = {}) {
        const headers = new Headers(this.headers);
        if (options.headers) for (const [key, value] of new Headers(options.headers).entries())headers.set(key, value);
        if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
        const requestOptions = {
            method: "POST",
            body: JSON.stringify(entity),
            ...options,
            headers
        };
        return this.fetchRequest(path, requestOptions);
    }
    async get(path, options = {}) {
        const headers = new Headers(this.headers);
        if (options.headers) for (const [key, value] of new Headers(options.headers).entries())headers.set(key, value);
        const requestOptions = {
            method: "GET",
            ...options,
            headers
        };
        return this.fetchRequest(path, requestOptions);
    }
    async put(path, entity, options = {}) {
        const headers = new Headers(this.headers);
        if (options.headers) for (const [key, value] of new Headers(options.headers).entries())headers.set(key, value);
        const requestOptions = {
            method: "PUT",
            body: JSON.stringify(entity),
            ...options,
            headers
        };
        return this.fetchRequest(path, requestOptions);
    }
    async patch(path, entity, options = {}) {
        const headers = new Headers(this.headers);
        if (options.headers) for (const [key, value] of new Headers(options.headers).entries())headers.set(key, value);
        const requestOptions = {
            method: "PATCH",
            body: JSON.stringify(entity),
            ...options,
            headers
        };
        return this.fetchRequest(path, requestOptions);
    }
    async delete(path, query) {
        const requestOptions = {
            method: "DELETE",
            body: JSON.stringify(query),
            headers: this.headers
        };
        return this.fetchRequest(path, requestOptions);
    }
};
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2831afb2._.js.map