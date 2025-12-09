
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { type FirebaseApp } from 'firebase/app';

// This function should only be called on the client-side.
export function initializeAnalytics(app: FirebaseApp): Analytics | null {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CRASHLYTICS_ENABLED === 'true') {
        try {
            return getAnalytics(app);
        } catch (e) {
            console.error("Failed to initialize Firebase Analytics", e);
            return null;
        }
    }
    return null;
}
