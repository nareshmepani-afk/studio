/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { generateVoucherPdf } from '@/lib/pdf/voucherCard';
import { GiftVoucherDocument } from '@/types/gift';
import { PDFDocument } from 'pdf-lib';

const baseVoucher: GiftVoucherDocument = {
  code: 'MW-VAULT-7K8P-9Q2M',
  tier: 'generational_vault',
  vaultQuotaGb: 100,
  durationDays: null,
  status: 'unredeemed',
  giverUid: 'user_giver_123',
  giverName: 'Anand Patel',
  giverEmail: 'anand@example.com',
  giftMessage: 'A gift of living history to preserve your life stories for our family across generations.',
  recipientName: 'Kishor Patel',
  recipientEmail: 'kishor@example.com',
  deliveryMode: 'printable_pdf',
  purchasedAt: '2026-09-12T12:00:00Z',
  unboxingLanguage: 'en',
  isFounderMint: true,
  amountPaid: 0,
  currency: 'gbp',
  failedAttempts: 0,
  expiresAt: null,
};

describe('Sprint 3 / Ticket #230: 5"×7" Keepsake Vector PDF Generator', () => {
  it('generates a valid PDF buffer in under 400ms with magic bytes and metadata', async () => {
    // Warm-up cache if cold
    await generateVoucherPdf(baseVoucher);

    const startTime = performance.now();
    const pdfBytes = await generateVoucherPdf(baseVoucher);
    const durationMs = performance.now() - startTime;

    expect(durationMs).toBeLessThan(400);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(10000);

    // Verify magic bytes: %PDF-
    const headerMagic = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
    expect(headerMagic).toBe('%PDF-');

    // Verify metadata /Title tag in PDF payload
    const latin1String = Buffer.from(pdfBytes).toString('latin1');
    expect(latin1String).toContain('/Title');
    const loadedDoc = await PDFDocument.load(pdfBytes);
    expect(loadedDoc.getTitle()).toContain('MW-VAULT-7K8P-9Q2M');
  });

  it('renders a 10"×7" flat canvas (720pt × 504pt) folding down the centre into a 5"×7" card', async () => {
    const pdfBytes = await generateVoucherPdf(baseVoucher);
    const loadedDoc = await PDFDocument.load(pdfBytes);

    expect(loadedDoc.getPageCount()).toBe(1);
    const page = loadedDoc.getPage(0);
    const { width, height } = page.getSize();

    expect(width).toBe(720); // 10 inches @ 72 pt/in
    expect(height).toBe(504); // 7 inches @ 72 pt/in
  });

  it('renders Gujarati diaspora dedication ("મારા વ્હાલા") without unhandled glyph errors (Rule 35.3)', async () => {
    const gujaratiVoucher: GiftVoucherDocument = {
      ...baseVoucher,
      code: 'MW-VAULT-GUJR-2026',
      recipientName: 'દાદાજી',
      giftMessage: 'મારા વ્હાલા દાદાજી, તમારી જીવનયાત્રા અમારા પરિવારનો અમૂલ્ય વારસો છે. અખંડ પ્રેમ અને આદર સાથે.',
      unboxingLanguage: 'gu',
    };

    const pdfBytes = await generateVoucherPdf(gujaratiVoucher);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(pdfBytes.slice(0, 5)).toString('ascii')).toBe('%PDF-');
    expect(pdfBytes.length).toBeGreaterThan(50000); // SubsetFont embedded
  });

  it('renders Hindi / Devanagari diaspora dedication ("पूज्य") without unhandled glyph errors (Rule 35.3)', async () => {
    const devanagariVoucher: GiftVoucherDocument = {
      ...baseVoucher,
      code: 'MW-VAULT-HIND-2026',
      recipientName: 'पूज्य माताजी',
      giftMessage: 'पूज्य माताजी और पिताजी, आपकी जीवन गाथा हमारे परिवार की अनमोल धरोहर है। सादर चरण स्पर्श।',
      unboxingLanguage: 'hi',
    };

    const pdfBytes = await generateVoucherPdf(devanagariVoucher);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(pdfBytes.slice(0, 5)).toString('ascii')).toBe('%PDF-');
    expect(pdfBytes.length).toBeGreaterThan(50000);
  });

  it('renders Punjabi / Gurmukhi diaspora dedication ("ਪੂਜਨੀਕ") without unhandled glyph errors (Rule 35.3)', async () => {
    const gurmukhiVoucher: GiftVoucherDocument = {
      ...baseVoucher,
      code: 'MW-VAULT-PUNJ-2026',
      recipientName: 'ਪੂਜਨੀਕ ਬਾਬਾ ਜੀ',
      giftMessage: 'ਪੂਜਨੀਕ ਬਾਬਾ ਜੀ, ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦੀ ਕਹਾਣੀ ਸਾਡੇ ਸਮੁੱਚੇ ਪਰਿਵਾਰ ਲਈ ਪ੍ਰੇਰਨਾ ਦਾ ਸਰੋਤ ਹੈ। ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ।',
      unboxingLanguage: 'pa',
    };

    const pdfBytes = await generateVoucherPdf(gurmukhiVoucher);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(pdfBytes.slice(0, 5)).toString('ascii')).toBe('%PDF-');
    expect(pdfBytes.length).toBeGreaterThan(30000);
  });

  it('gracefully handles empty or missing dedication text and director tier parameters', async () => {
    const minimalDirectorVoucher: GiftVoucherDocument = {
      ...baseVoucher,
      code: 'MW-DIR-EMPTY-2026',
      tier: 'director',
      vaultQuotaGb: 15,
      durationDays: 31,
      giftMessage: '',
      recipientName: '',
      giverName: '',
    };

    const pdfBytes = await generateVoucherPdf(minimalDirectorVoucher);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(pdfBytes.slice(0, 5)).toString('ascii')).toBe('%PDF-');
  });
});
