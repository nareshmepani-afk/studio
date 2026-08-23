import { EmailTemplateId, EMAIL_TEMPLATES_CATALOG } from './emailTemplates';
import { EmailDispatchReceipt } from '@/app/admin/emailActions';

export interface ParsedAudienceRow {
  id: string;
  email: string;
  name: string;
  props: Record<string, string>;
  isValid: boolean;
  errorReason?: string;
  isDuplicate?: boolean;
  status: 'PENDING' | 'QUEUED' | 'IN_FLIGHT' | 'DELIVERED' | 'SIMULATED' | 'FAILED' | 'SKIPPED';
  receipt?: EmailDispatchReceipt;
}

export interface CsvParseResult {
  totalRows: number;
  validRows: ParsedAudienceRow[];
  invalidRows: ParsedAudienceRow[];
  duplicateCount: number;
  headers: string[];
  unmappedHeaders: string[];
}

/**
 * Robust RFC 4180-compliant CSV string tokenizer
 * Correctly parses quotes, escaped quotes (""), embedded commas, and multiline values.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;
  const text = csvText.trim();
  const len = text.length;

  if (len === 0) return [];

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double-quote inside quotes
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip \n in CRLF
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push last cell & row if text does not end with newline
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const EMAIL_HEADER_SYNONYMS = [
  'email',
  'e-mail',
  'recipient_email',
  'recipientemail',
  'mail',
  'to',
  'address',
  'invitee_email',
  'inviteeemail',
  'director_email'
];

const NAME_HEADER_SYNONYMS = [
  'name',
  'recipient_name',
  'recipientname',
  'full_name',
  'fullname',
  'director_name',
  'host_name',
  'hostname',
  'inviter_name',
  'invitername',
  'invitee_name',
  'contact'
];

/**
 * Normalises a header string for synonym matching
 */
function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parses raw CSV content and maps it to target email template parameters.
 */
export function parseAudienceCsv(
  csvText: string,
  templateId: EmailTemplateId
): CsvParseResult {
  const rawRows = parseCsvRows(csvText);
  if (rawRows.length === 0) {
    return {
      totalRows: 0,
      validRows: [],
      invalidRows: [],
      duplicateCount: 0,
      headers: [],
      unmappedHeaders: []
    };
  }

  const rawHeaders = rawRows[0];
  const dataRows = rawRows.slice(1);

  // Locate email column index
  let emailColIdx = -1;
  let nameColIdx = -1;

  rawHeaders.forEach((h, idx) => {
    const norm = normaliseHeader(h);
    if (emailColIdx === -1 && EMAIL_HEADER_SYNONYMS.some(syn => normaliseHeader(syn) === norm)) {
      emailColIdx = idx;
    }
    if (nameColIdx === -1 && NAME_HEADER_SYNONYMS.some(syn => normaliseHeader(syn) === norm)) {
      nameColIdx = idx;
    }
  });

  // If email column wasn't matched by synonym, check if column 0 contains @ in any row
  if (emailColIdx === -1) {
    const firstColHasEmail = dataRows.some(row => row[0] && EMAIL_REGEX.test(row[0].trim()));
    if (firstColHasEmail) {
      emailColIdx = 0;
    }
  }

  const templateMeta = EMAIL_TEMPLATES_CATALOG.find(t => t.id === templateId) || EMAIL_TEMPLATES_CATALOG[0];
  const defaultProps = templateMeta.defaultProps || {};

  const validRows: ParsedAudienceRow[] = [];
  const invalidRows: ParsedAudienceRow[] = [];
  const seenEmails = new Set<string>();
  let duplicateCount = 0;

  dataRows.forEach((rowCells, rowIdx) => {
    // Skip completely empty rows
    if (rowCells.every(c => !c || c.trim() === '')) {
      return;
    }

    const rowId = `aud_${templateId}_${rowIdx + 1}_${Date.now().toString(36)}`;
    const rawEmail = (emailColIdx !== -1 && rowCells[emailColIdx]) ? rowCells[emailColIdx].trim() : '';
    const rawName = (nameColIdx !== -1 && rowCells[nameColIdx]) ? rowCells[nameColIdx].trim() : '';

    // Build row props from all columns
    const props: Record<string, string> = { ...defaultProps };

    rawHeaders.forEach((headerName, colIdx) => {
      const cellValue = rowCells[colIdx]?.trim();
      if (cellValue !== undefined && cellValue !== '') {
        props[headerName] = cellValue;
        // Also map camelCase or standard keys if matching
        const normH = normaliseHeader(headerName);
        Object.keys(defaultProps).forEach(defaultKey => {
          if (normaliseHeader(defaultKey) === normH) {
            props[defaultKey] = cellValue;
          }
        });
      }
    });

    if (rawName) {
      props.name = rawName;
      props.recipientName = rawName;
    }

    if (rawEmail) {
      props.email = rawEmail.toLowerCase();
    }

    // Validation
    if (!rawEmail) {
      invalidRows.push({
        id: rowId,
        email: '',
        name: rawName || 'Unknown',
        props,
        isValid: false,
        errorReason: 'Missing recipient email address.',
        status: 'FAILED'
      });
      return;
    }

    const normalisedEmail = rawEmail.toLowerCase();
    if (!EMAIL_REGEX.test(normalisedEmail)) {
      invalidRows.push({
        id: rowId,
        email: rawEmail,
        name: rawName || 'Unknown',
        props,
        isValid: false,
        errorReason: 'Invalid email syntax format.',
        status: 'FAILED'
      });
      return;
    }

    if (seenEmails.has(normalisedEmail)) {
      duplicateCount++;
      invalidRows.push({
        id: rowId,
        email: normalisedEmail,
        name: rawName || 'Duplicate Contact',
        props,
        isValid: false,
        isDuplicate: true,
        errorReason: 'Duplicate email address (first instance preserved).',
        status: 'SKIPPED'
      });
      return;
    }

    seenEmails.add(normalisedEmail);
    validRows.push({
      id: rowId,
      email: normalisedEmail,
      name: rawName || defaultProps.name || defaultProps.recipientName || 'Storyteller Director',
      props,
      isValid: true,
      status: 'PENDING'
    });
  });

  const unmappedHeaders = rawHeaders.filter(h => {
    const norm = normaliseHeader(h);
    const isEmail = EMAIL_HEADER_SYNONYMS.some(s => normaliseHeader(s) === norm);
    const isName = NAME_HEADER_SYNONYMS.some(s => normaliseHeader(s) === norm);
    const isDefaultKey = Object.keys(defaultProps).some(k => normaliseHeader(k) === norm);
    return !isEmail && !isName && !isDefaultKey;
  });

  return {
    totalRows: dataRows.length,
    validRows,
    invalidRows,
    duplicateCount,
    headers: rawHeaders,
    unmappedHeaders
  };
}

/**
 * Generates an RFC 4180-compliant template-specific sample CSV boilerplate.
 */
export function generateSampleAudienceCsv(templateId: EmailTemplateId): string {
  switch (templateId) {
    case 'welcome_host_pass':
      return [
        'email,name,claimedMemoryTitle,studioUrl,cinemaUrl',
        'eleanor.vance@example.co.uk,"Director Eleanor Vance","Summer on the Coast, 1964",https://dev.memoryweaver.studio/studio,https://dev.memoryweaver.studio/cinema',
        'arthur.pendelton@example.co.uk,"Arthur Pendelton","The Orchard Harvest & Family Roots",https://dev.memoryweaver.studio/studio,https://dev.memoryweaver.studio/cinema',
        'clara.oswald@example.co.uk,"Clara Oswald","First Steps in the Highlands, 1982",https://dev.memoryweaver.studio/studio,https://dev.memoryweaver.studio/cinema'
      ].join('\r\n');

    case 'collaborator_invite':
      return [
        'inviteeEmail,inviterName,memoryTitle,role,passcode,inviteUrl',
        'sarah.pendelton@example.co.uk,"Arthur Pendelton","The Orchard Harvest & Family Roots","Guest Director & Storyteller",8492,https://dev.memoryweaver.studio/studio?collab=8492',
        'michael.vance@example.co.uk,"Eleanor Vance","Summer on the Coast, 1964","Co-Director & Audio Archivist",5219,https://dev.memoryweaver.studio/studio?collab=5219',
        'george.oswald@example.co.uk,"Clara Oswald","First Steps in the Highlands","Family Storyteller",3390,https://dev.memoryweaver.studio/studio?collab=3390'
      ].join('\r\n');

    case 'password_reset':
      return [
        'email,resetLink,expiresInMinutes',
        'director.eleanor@example.co.uk,https://dev.memoryweaver.studio/auth/reset-password?token=SAMPLE_TOKEN_01,60',
        'director.arthur@example.co.uk,https://dev.memoryweaver.studio/auth/reset-password?token=SAMPLE_TOKEN_02,60',
        'director.clara@example.co.uk,https://dev.memoryweaver.studio/auth/reset-password?token=SAMPLE_TOKEN_03,60'
      ].join('\r\n');

    case 'premiere_notification':
      return [
        'email,recipientName,hostName,memoryTitle,releaseYear,runtime,cinemaUrl',
        'family.vance@example.co.uk,"The Vance Family","Eleanor Vance","Summer on the Coast, 1964",2026,04:18,https://dev.memoryweaver.studio/cinema?id=demo_summer_1964',
        'archivist.clara@example.co.uk,"Highland Heritage Guild","Clara Oswald","First Steps in the Highlands",2026,05:42,https://dev.memoryweaver.studio/cinema?id=demo_highlands_1982',
        'patron.arthur@example.co.uk,"Arthur\'s Circle","Arthur Pendelton","The Orchard Harvest & Family Roots",2026,03:55,https://dev.memoryweaver.studio/cinema?id=demo_orchard_harvest'
      ].join('\r\n');

    default:
      return 'email,name\r\nstoryteller@example.co.uk,"Storyteller Director"';
  }
}

/**
 * Returns a 5-storyteller demo audience preset for instant staging testing without uploading CSV files.
 */
export function getDemoAudiencePreset(templateId: EmailTemplateId): ParsedAudienceRow[] {
  const sampleCsv = generateSampleAudienceCsv(templateId);
  const parsed = parseAudienceCsv(sampleCsv, templateId);
  
  // Add 2 extra sample storytellers to make a 5-contact batch
  const extraRows: ParsedAudienceRow[] = [
    {
      id: `aud_${templateId}_demo_4`,
      email: 'beatrice.montague@example.co.uk',
      name: 'Beatrice Montague',
      props: {
        ...parsed.validRows[0]?.props,
        email: 'beatrice.montague@example.co.uk',
        name: 'Beatrice Montague',
        recipientName: 'Beatrice Montague',
        claimedMemoryTitle: 'The Grand Library at Dusk, 1975'
      },
      isValid: true,
      status: 'PENDING'
    },
    {
      id: `aud_${templateId}_demo_5`,
      email: 'edward.sterling@example.co.uk',
      name: 'Edward Sterling',
      props: {
        ...parsed.validRows[0]?.props,
        email: 'edward.sterling@example.co.uk',
        name: 'Edward Sterling',
        recipientName: 'Edward Sterling',
        claimedMemoryTitle: 'First Voyage on the Thames, 1958'
      },
      isValid: true,
      status: 'PENDING'
    }
  ];

  return [...parsed.validRows, ...extraRows];
}

/**
 * Converts batch execution receipts into a downloadable RFC 4180 CSV audit report.
 */
export function generateBatchAuditCsv(receipts: Array<{ id: string; receipt?: EmailDispatchReceipt }>): string {
  const headers = ['Recipient Email', 'Status', 'Message ID', 'Subject', 'Timestamp', 'SPF', 'DKIM', 'DMARC', 'Error'];
  const rows = receipts.map(item => {
    const r = item.receipt;
    if (!r) {
      return [`"N/A"`, `"QUEUED"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`];
    }
    return [
      `"${(r.targetEmail || '').replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${(r.messageId || '').replace(/"/g, '""')}"`,
      `"${(r.subject || '').replace(/"/g, '""')}"`,
      `"${r.timestamp}"`,
      `"${r.spfValid ? 'PASSED' : 'FAILED'}"`,
      `"${r.dkimValid ? 'VERIFIED' : 'FAILED'}"`,
      `"${r.dmarcValid ? 'ENFORCED' : 'FAILED'}"`,
      `"${(r.error || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

