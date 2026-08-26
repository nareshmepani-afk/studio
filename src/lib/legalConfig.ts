/**
 * ============================================================================
 * LEGAL SUITE CONFIGURATION & EFFECTIVE DATES (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * Centralized registry for all legal documents, version tags, and last-updated
 * timestamps. All dates must follow British English (UK) orthography (DD Month YYYY).
 */

export interface LegalDocumentMeta {
  id: 'terms' | 'privacy' | 'cookies';
  title: string;
  shortTitle: string;
  route: string;
  lastUpdated: string;
  version: string;
  applicableLaw: string;
}

export const LEGAL_CONFIG: Record<'terms' | 'privacy' | 'cookies', LegalDocumentMeta> = {
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    shortTitle: 'Terms',
    route: '/legal/terms',
    lastUpdated: '26 August 2026',
    version: 'v1.2.0',
    applicableLaw: 'Laws of England and Wales',
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    route: '/legal/privacy',
    lastUpdated: '26 August 2026',
    version: 'v1.2.0',
    applicableLaw: 'UK Data Protection Act 2018 & UK GDPR',
  },
  cookies: {
    id: 'cookies',
    title: 'Cookie & Local Storage Policy',
    shortTitle: 'Cookies',
    route: '/legal/cookies',
    lastUpdated: '26 August 2026',
    version: 'v1.2.0',
    applicableLaw: 'UK PECR & Data Protection Act 2018',
  },
};

export const GLOBAL_LEGAL_CONTACT = {
  dpoEmail: 'support@memoryweaver.studio',
  icoRegistration: 'Information Commissioner\'s Office (ICO) UK',
  supportSubjectPrefix: '[Legal & Privacy Enquiry]',
};

export function getLegalMetaForPath(pathname: string | null): LegalDocumentMeta {
  if (!pathname) return LEGAL_CONFIG.terms;
  if (pathname.includes('/legal/privacy')) return LEGAL_CONFIG.privacy;
  if (pathname.includes('/legal/cookies')) return LEGAL_CONFIG.cookies;
  return LEGAL_CONFIG.terms;
}
