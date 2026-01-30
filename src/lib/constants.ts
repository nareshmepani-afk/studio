export const STANDARD_HOST_STORAGE_QUOTA_BYTES = 50 * 1024 * 1024;
export const SESSION_COOKIE_NAME = 'firebase-session';
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: '/',
}; 
