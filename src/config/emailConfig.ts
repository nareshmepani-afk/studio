/**
 * Centralized Email Configuration & Domain Routing Directory
 * Single Source of Truth (SSOT) for all @memoryweaver.studio email addresses,
 * inbound Cloudflare Email Routing mappings, and outbound Resend dispatch configurations.
 */

export type EmailInboundProvider = 
  | 'Cloudflare Email Routing'
  | 'Support Helpdesk / Ingestion'
  | 'DMARC Security Parser'
  | 'None (No-Reply / Discarded)';

export type EmailOutboundProvider = 
  | 'Resend SMTP (Gmail Send-As)'
  | 'Resend API (Transactional)'
  | 'None';

export type EmailCategory = 
  | 'concierge' 
  | 'support' 
  | 'executive' 
  | 'transactional' 
  | 'compliance';

export interface StudioEmailDefinition {
  key: string;
  address: string;
  displayName: string;
  formattedSender: string;
  role: string;
  description: string;
  category: EmailCategory;
  isPublicFacing: boolean;
  inboundRouting: {
    provider: EmailInboundProvider;
    destination: string;
    description: string;
    isForwardingActive: boolean;
  };
  outboundRouting: {
    provider: EmailOutboundProvider;
    credentials: string;
    description: string;
  };
}

/**
 * Standard Email Addresses Constants
 */
export const STUDIO_EMAILS = {
  STUDIO: 'studio@memoryweaver.studio',
  SUPPORT: 'support@memoryweaver.studio',
  DIRECTOR: 'director@memoryweaver.studio',
  NOREPLY: 'noreply@memoryweaver.studio',
  DMARC: 'dmarc@memoryweaver.studio',
} as const;

/**
 * Standard Email Sender Headers Constants
 */
export const STUDIO_EMAIL_SENDERS = {
  STUDIO: 'Memory Weaver Studio <studio@memoryweaver.studio>',
  SUPPORT: 'Memory Weaver Support <support@memoryweaver.studio>',
  DIRECTOR: 'Memory Weaver Director Concierge <director@memoryweaver.studio>',
  NOREPLY: 'Memory Weaver <noreply@memoryweaver.studio>',
  CONTACT: 'Memory Weaver Contact <noreply@memoryweaver.studio>',
} as const;

/**
 * Master Domain Inboxes & Cloudflare Routing Directory
 */
export const STUDIO_EMAIL_DIRECTORY: StudioEmailDefinition[] = [
  {
    key: 'studio',
    address: STUDIO_EMAILS.STUDIO,
    displayName: 'Memory Weaver Studio',
    formattedSender: STUDIO_EMAIL_SENDERS.STUDIO,
    role: 'Studio Concierge & Patron Onboarding',
    description: 'Primary public-facing studio contact for story onboarding, welcome host passes, and client inquiries.',
    category: 'concierge',
    isPublicFacing: true,
    inboundRouting: {
      provider: 'Cloudflare Email Routing',
      destination: 'Primary Personal Gmail (Alias Forwarding)',
      description: 'Cloudflare Email Routing intercepts inbound messages and forwards directly to primary personal Gmail at zero infrastructure cost.',
      isForwardingActive: true,
    },
    outboundRouting: {
      provider: 'Resend SMTP (Gmail Send-As)',
      credentials: 'smtp.resend.com (Port 465/587) via Resend API Key',
      description: 'Configured in Gmail "Send Mail As" paired with Resend SMTP credentials to enable domain-authenticated replies directly from Gmail interface.',
    },
  },
  {
    key: 'support',
    address: STUDIO_EMAILS.SUPPORT,
    displayName: 'Memory Weaver Support',
    formattedSender: STUDIO_EMAIL_SENDERS.SUPPORT,
    role: 'Technical Helpdesk & Bug Report Ingestion',
    description: 'Receives automated bug reports (Ctrl+/), contact form inquiries, and customer technical assistance requests.',
    category: 'support',
    isPublicFacing: true,
    inboundRouting: {
      provider: 'Cloudflare Email Routing',
      destination: 'Primary Personal Gmail & Plane.so Backlog',
      description: 'Forwards support inquiries and diagnostic reports to designated support inbox with Plane.so issue ingestion linkage.',
      isForwardingActive: true,
    },
    outboundRouting: {
      provider: 'Resend API (Transactional)',
      credentials: 'RESEND_API_KEY environment token',
      description: 'Dispatches automated receipt confirmations, ticket updates, and diagnostic alerts via Resend server actions.',
    },
  },
  {
    key: 'director',
    address: STUDIO_EMAILS.DIRECTOR,
    displayName: 'Memory Weaver Director Concierge',
    formattedSender: STUDIO_EMAIL_SENDERS.DIRECTOR,
    role: 'Executive & VIP Patron Concierge',
    description: 'Direct channel for executive director communications, heirloom bespoke commissions, and VIP patron inquiries.',
    category: 'executive',
    isPublicFacing: false,
    inboundRouting: {
      provider: 'Cloudflare Email Routing',
      destination: 'Primary Personal Gmail (Direct Route)',
      description: 'Direct priority routing rule in Cloudflare Email Routing forwarding immediately to the executive personal inbox.',
      isForwardingActive: true,
    },
    outboundRouting: {
      provider: 'Resend SMTP (Gmail Send-As)',
      credentials: 'smtp.resend.com (Port 465/587) via Resend API Key',
      description: 'Sent directly from Gmail using custom Send-As persona authenticated against memoryweaver.studio DKIM.',
    },
  },
  {
    key: 'noreply',
    address: STUDIO_EMAILS.NOREPLY,
    displayName: 'Memory Weaver',
    formattedSender: STUDIO_EMAIL_SENDERS.NOREPLY,
    role: 'System Automated Transactional Alerts',
    description: 'One-way outbound sender for security alerts, password resets, collaborator invitations, and premiere ready notifications.',
    category: 'transactional',
    isPublicFacing: false,
    inboundRouting: {
      provider: 'None (No-Reply / Discarded)',
      destination: 'Auto-Discard / Rejection Rule',
      description: 'Inbound emails to noreply@ are automatically dropped by Cloudflare Email Routing rule.',
      isForwardingActive: false,
    },
    outboundRouting: {
      provider: 'Resend API (Transactional)',
      credentials: 'RESEND_API_KEY environment token',
      description: 'Direct server-side transactional dispatch with strict SPF and DKIM alignment.',
    },
  },
  {
    key: 'dmarc',
    address: STUDIO_EMAILS.DMARC,
    displayName: 'DMARC Security Reporter',
    formattedSender: 'dmarc@memoryweaver.studio',
    role: 'Email Security & Deliverability Compliance',
    description: 'Receives automated XML aggregate and forensic DMARC reports from mailbox providers (Google, Microsoft, Apple, Yahoo).',
    category: 'compliance',
    isPublicFacing: false,
    inboundRouting: {
      provider: 'DMARC Security Parser',
      destination: 'rua=mailto:dmarc@memoryweaver.studio',
      description: 'Aggregates authentication statistics and deliverability status across the domain.',
      isForwardingActive: true,
    },
    outboundRouting: {
      provider: 'None',
      credentials: 'N/A (Inbound telemetry only)',
      description: 'Dedicated security reporting inbox.',
    },
  },
];

/**
 * Helper to look up email definition by key or address
 */
export function getEmailConfigByAddress(addressOrKey: string): StudioEmailDefinition | undefined {
  const normalized = addressOrKey.trim().toLowerCase();
  return STUDIO_EMAIL_DIRECTORY.find(
    (e) => e.address.toLowerCase() === normalized || e.key.toLowerCase() === normalized
  );
}

/**
 * Helper to get all public-facing email addresses
 */
export function getPublicFacingEmails(): StudioEmailDefinition[] {
  return STUDIO_EMAIL_DIRECTORY.filter((e) => e.isPublicFacing);
}
