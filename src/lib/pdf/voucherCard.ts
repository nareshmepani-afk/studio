import 'regenerator-runtime/runtime';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as fontkit from 'fontkit';
import QRCode from 'qrcode';
import { GiftVoucherDocument, GIFT_TIER_DISPLAY } from '@/types/gift';
import { sanitiseRecipientName } from '@/lib/dedicationMuse';

// In-memory font cache to guarantee sub-400ms execution
let cachedPlayfair: Uint8Array | null = null;
let cachedGujarati: Uint8Array | null = null;
let cachedDevanagari: Uint8Array | null = null;
let cachedGurmukhi: Uint8Array | null = null;

function loadFontBuffer(relativePath: string): Uint8Array | null {
  try {
    const p1 = path.join(process.cwd(), relativePath);
    if (fs.existsSync(p1)) {
      const b = fs.readFileSync(p1);
      return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    }
    const p2 = path.resolve(__dirname, '../../../../', relativePath);
    if (fs.existsSync(p2)) {
      const b = fs.readFileSync(p2);
      return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    }
  } catch (e) {
    console.warn(`[PDF Font Engine] Could not load font from ${relativePath}:`, e);
  }
  return null;
}

function getCachedFonts() {
  if (!cachedPlayfair) cachedPlayfair = loadFontBuffer('public/fonts/playfair/PlayfairDisplay-Regular.ttf');
  if (!cachedGujarati) cachedGujarati = loadFontBuffer('public/fonts/noto/NotoSansGujarati-Regular.ttf');
  if (!cachedDevanagari) cachedDevanagari = loadFontBuffer('public/fonts/noto/NotoSansDevanagari-Regular.ttf');
  if (!cachedGurmukhi) cachedGurmukhi = loadFontBuffer('public/fonts/noto/NotoSansGurmukhi-Regular.ttf');
  return {
    playfair: cachedPlayfair,
    gujarati: cachedGujarati,
    devanagari: cachedDevanagari,
    gurmukhi: cachedGurmukhi,
  };
}

/**
 * Patch fontkit OpenType GPOS anchor processor so that null anchor tables
 * (common in complex Indic mark-to-base and mark-to-mark classes like Devanagari / Gurmukhi)
 * do not throw unhandled "Cannot read properties of null (reading 'xCoordinate')" errors.
 */
function patchFontkitGPOS(fontkitInstance: any) {
  try {
    const fonts = getCachedFonts();
    const sample = fonts.gujarati || fonts.playfair || fonts.devanagari;
    if (sample && fontkitInstance?.create) {
      const dummyFont = fontkitInstance.create(sample);
      if (dummyFont?._layoutEngine?.engine?.GPOSProcessor) {
        const gposProto = Object.getPrototypeOf(dummyFont._layoutEngine.engine.GPOSProcessor);
        if (gposProto && !gposProto.__patchedForNullAnchors && typeof gposProto.getAnchor === 'function') {
          const origGetAnchor = gposProto.getAnchor;
          gposProto.getAnchor = function (anchor: any) {
            if (!anchor) return { x: 0, y: 0 };
            return origGetAnchor.call(this, anchor);
          };
          gposProto.__patchedForNullAnchors = true;
        }
      }
    }
  } catch (e) {
    console.warn('[PDF Font Engine] GPOSProcessor patch notice:', e);
  }
}

/**
 * Wraps text into lines that fit within a specified character count.
 */
function wrapProse(text: string, maxChars = 38): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';

  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Detects whether a string contains Indic scripts and returns the appropriate font.
 */
function resolveFont(
  text: string,
  fonts: { playfair: PDFFont; guj?: PDFFont; dev?: PDFFont; gur?: PDFFont; fallback: PDFFont }
): PDFFont {
  if (/[\u0A80-\u0AFF]/.test(text) && fonts.guj) return fonts.guj;
  if (/[\u0900-\u097F]/.test(text) && fonts.dev) return fonts.dev;
  if (/[\u0A00-\u0A7F]/.test(text) && fonts.gur) return fonts.gur;
  return fonts.playfair || fonts.fallback;
}

/**
 * Generates a 10"×7" flat vector canvas luxury keepsake card folding down the centre into a 5"×7" card.
 * Dimensions: 720 points × 504 points (10" × 7" at 72 DPI standard PDF units).
 * Left Panel (0–360 pt): Front Cover presentation & gold crest.
 * Right Panel (360–720 pt): Inside Spread personal dedication, 35mm film cell, and QR unboxing portal.
 */
export async function generateVoucherPdf(voucher: GiftVoucherDocument): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit as any);
  patchFontkitGPOS(fontkit);

  // Set standard PDF document metadata
  doc.setTitle(`Memory Weaver Heirloom Keepsake — ${voucher.code}`);
  doc.setAuthor('Memory Weaver Studio');
  doc.setSubject('Act V Keepsake Voucher & Theatrical Unboxing Card');
  doc.setKeywords(['Memory Weaver', 'Heirloom', 'Keepsake', 'Spoken Memoir', voucher.code]);
  doc.setCreator('Memory Weaver Luxury Vector PDF Engine');
  doc.setProducer('pdf-lib + fontkit Indic Typography Engine');

  // Load fallback font
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Load custom TTF fonts
  const fontBuffers = getCachedFonts();
  let playfairFont: PDFFont = helvetica;
  let gujFont: PDFFont | undefined;
  let devFont: PDFFont | undefined;
  let gurFont: PDFFont | undefined;

  if (fontBuffers.playfair) {
    try {
      playfairFont = await doc.embedFont(fontBuffers.playfair);
    } catch (e) {
      console.warn('[PDF Font Engine] Failed to embed Playfair Display:', e);
    }
  }

  const combinedText = (voucher.giftMessage || '') + ' ' + (voucher.recipientName || '') + ' ' + (voucher.giverName || '');
  if (/[\u0A80-\u0AFF]/.test(combinedText) && fontBuffers.gujarati) {
    try {
      gujFont = await doc.embedFont(fontBuffers.gujarati);
    } catch (e) {
      console.warn('[PDF Font Engine] Failed to embed Gujarati font:', e);
    }
  }
  if (/[\u0900-\u097F]/.test(combinedText) && fontBuffers.devanagari) {
    try {
      devFont = await doc.embedFont(fontBuffers.devanagari);
    } catch (e) {
      console.warn('[PDF Font Engine] Failed to embed Devanagari font:', e);
    }
  }
  if (/[\u0A00-\u0A7F]/.test(combinedText) && fontBuffers.gurmukhi) {
    try {
      gurFont = await doc.embedFont(fontBuffers.gurmukhi);
    } catch (e) {
      console.warn('[PDF Font Engine] Failed to embed Gurmukhi font:', e);
    }
  }

  const fontBundle = {
    playfair: playfairFont,
    guj: gujFont,
    dev: devFont,
    gur: gurFont,
    fallback: helvetica,
  };

  // Dimensions: 10" x 7" (720 pt x 504 pt)
  const page = doc.addPage([720, 504]);
  const { width, height } = page.getSize();

  // Luxury Color Palette
  const obsidian = rgb(10 / 255, 10 / 255, 10 / 255); // #0A0A0A
  const slateCard = rgb(18 / 255, 20 / 255, 26 / 255); // #12141A
  const gold = rgb(212 / 255, 175 / 255, 55 / 255); // #D4AF37
  const goldLight = rgb(245 / 255, 218 / 255, 122 / 255); // #F5DA7A
  const amber = rgb(245 / 255, 158 / 255, 11 / 255); // #F59E0B
  const mutedGold = rgb(153 / 255, 125 / 255, 36 / 255); // #997D24
  const offWhite = rgb(243 / 255, 244 / 255, 246 / 255); // #F3F4F6
  const textMuted = rgb(156 / 255, 163 / 255, 175 / 255); // #9CA3AF

  // 1. Full Canvas Obsidian Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: obsidian,
  });

  // 2. Center Fold Scoring Guide (Dashed line down the vertical centre)
  page.drawLine({
    start: { x: 360, y: 15 },
    end: { x: 360, y: 489 },
    thickness: 0.5,
    color: rgb(0.25, 0.25, 0.28),
    dashArray: [4, 4],
  });

  // Fold indicator labels at very top and bottom margins
  page.drawText('FOLD CENTRE', {
    x: 341,
    y: 6,
    size: 5,
    font: helvetica,
    color: rgb(0.35, 0.35, 0.4),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LEFT PANEL: FRONT COVER (X: 0 → 360 pt, Centre X: 180 pt)
  // ───────────────────────────────────────────────────────────────────────────

  // Outer Gold Filigree Border
  page.drawRectangle({
    x: 18,
    y: 18,
    width: 324,
    height: 468,
    borderColor: gold,
    borderWidth: 1.25,
    color: obsidian,
  });

  // Inner Subtle Border
  page.drawRectangle({
    x: 23,
    y: 23,
    width: 314,
    height: 458,
    borderColor: mutedGold,
    borderWidth: 0.5,
    color: obsidian,
  });

  // Ornamental Corner Filigree Accents (Diamonds)
  const drawCornerDiamond = (cx: number, cy: number) => {
    const s = 3.5;
    page.drawLine({ start: { x: cx - s, y: cy }, end: { x: cx, y: cy + s }, thickness: 1, color: gold });
    page.drawLine({ start: { x: cx, y: cy + s }, end: { x: cx + s, y: cy }, thickness: 1, color: gold });
    page.drawLine({ start: { x: cx + s, y: cy }, end: { x: cx, y: cy - s }, thickness: 1, color: gold });
    page.drawLine({ start: { x: cx, y: cy - s }, end: { x: cx - s, y: cy }, thickness: 1, color: gold });
  };
  drawCornerDiamond(23, 23);
  drawCornerDiamond(337, 23);
  drawCornerDiamond(23, 481);
  drawCornerDiamond(337, 481);

  // Top Header Badge
  const topBadgeText = 'ACT V HEIRLOOM KEEPSAKE';
  page.drawText(topBadgeText, {
    x: 180 - (helvetica.widthOfTextAtSize(topBadgeText, 7) / 2),
    y: 454,
    size: 7,
    font: helvetica,
    color: amber,
  });

  // Main Brand Title
  const brandTitle = 'MEMORY WEAVER';
  page.drawText(brandTitle, {
    x: 180 - (playfairFont.widthOfTextAtSize(brandTitle, 22) / 2),
    y: 420,
    size: 22,
    font: playfairFont,
    color: gold,
  });

  // Brand Subtitle
  const brandSubtitle = 'A Commissioned Spoken Memoir';
  page.drawText(brandSubtitle, {
    x: 180 - (helvetica.widthOfTextAtSize(brandSubtitle, 8.5) / 2),
    y: 402,
    size: 8.5,
    font: helvetica,
    color: textMuted,
  });

  // Divider with centre diamond
  page.drawLine({ start: { x: 70, y: 388 }, end: { x: 165, y: 388 }, thickness: 0.75, color: mutedGold });
  drawCornerDiamond(180, 388);
  page.drawLine({ start: { x: 195, y: 388 }, end: { x: 290, y: 388 }, thickness: 0.75, color: mutedGold });

  // 35mm Film Cell Insignia Emblem (Vector Medallion)
  const emblemY = 300;
  // Outer concentric gold rings
  page.drawCircle({ x: 180, y: emblemY, size: 40, borderColor: gold, borderWidth: 1.5, color: slateCard });
  page.drawCircle({ x: 180, y: emblemY, size: 36, borderColor: mutedGold, borderWidth: 0.75 });
  page.drawCircle({ x: 180, y: emblemY, size: 32, borderColor: amber, borderWidth: 0.5 });

  // 35mm Film Frame Vector inside emblem
  page.drawRectangle({
    x: 164,
    y: emblemY - 18,
    width: 32,
    height: 36,
    borderColor: gold,
    borderWidth: 1.5,
    color: obsidian,
  });
  // Film frame inner aperture
  page.drawRectangle({
    x: 170,
    y: emblemY - 10,
    width: 20,
    height: 20,
    borderColor: goldLight,
    borderWidth: 1,
    color: rgb(0.12, 0.1, 0.05),
  });
  // Film sprockets (top and bottom perforations)
  for (let sx = 0; sx < 3; sx++) {
    page.drawRectangle({ x: 167 + (sx * 9), y: emblemY + 12, width: 4, height: 3, color: gold });
    page.drawRectangle({ x: 167 + (sx * 9), y: emblemY - 15, width: 4, height: 3, color: gold });
  }

  // Tier Title & Quota
  const tierConfig = GIFT_TIER_DISPLAY[voucher.tier] || GIFT_TIER_DISPLAY.generational_vault;
  const tierTitle = tierConfig.editorialName.toUpperCase();
  page.drawText(tierTitle, {
    x: 180 - (helveticaBold.widthOfTextAtSize(tierTitle, 10) / 2),
    y: 228,
    size: 10,
    font: helveticaBold,
    color: gold,
  });

  const tierQuota = `${voucher.vaultQuotaGb} GB Generational Archive • 4K Master Cinema`;
  page.drawText(tierQuota, {
    x: 180 - (helvetica.widthOfTextAtSize(tierQuota, 7.5) / 2),
    y: 213,
    size: 7.5,
    font: helvetica,
    color: amber,
  });

  // Beneficiary Attribution
  const cleanRecipient = sanitiseRecipientName(voucher.recipientName) || 'Honoured Storyteller';
  const recFont = resolveFont(cleanRecipient, fontBundle);

  page.drawText('Presented in honour of', {
    x: 180 - (helvetica.widthOfTextAtSize('Presented in honour of', 8) / 2),
    y: 172,
    size: 8,
    font: helvetica,
    color: textMuted,
  });

  page.drawText(cleanRecipient, {
    x: 180 - (recFont.widthOfTextAtSize(cleanRecipient, 15) / 2),
    y: 148,
    size: 15,
    font: recFont,
    color: offWhite,
  });

  page.drawText('Commissioned with love by', {
    x: 180 - (helvetica.widthOfTextAtSize('Commissioned with love by', 8) / 2),
    y: 118,
    size: 8,
    font: helvetica,
    color: textMuted,
  });

  const cleanGiver = sanitiseRecipientName(voucher.giverName) || 'Family & Loved Ones';
  const giverFont = resolveFont(cleanGiver, fontBundle);
  page.drawText(cleanGiver, {
    x: 180 - (giverFont.widthOfTextAtSize(cleanGiver, 13) / 2),
    y: 98,
    size: 13,
    font: giverFont,
    color: goldLight,
  });

  // Bottom Archival Preservation Line
  const bottomArchival = 'LONDON • NEW YORK • MUMBAI • 100-YEAR PRESERVATION';
  page.drawText(bottomArchival, {
    x: 180 - (helvetica.widthOfTextAtSize(bottomArchival, 5.5) / 2),
    y: 36,
    size: 5.5,
    font: helvetica,
    color: rgb(0.5, 0.45, 0.3),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // RIGHT PANEL: INSIDE SPREAD (X: 360 → 720 pt, Centre X: 540 pt)
  // ───────────────────────────────────────────────────────────────────────────

  // Outer Gold Filigree Border
  page.drawRectangle({
    x: 378,
    y: 18,
    width: 324,
    height: 468,
    borderColor: gold,
    borderWidth: 1.25,
    color: obsidian,
  });

  // Inner Subtle Border
  page.drawRectangle({
    x: 383,
    y: 23,
    width: 314,
    height: 458,
    borderColor: mutedGold,
    borderWidth: 0.5,
    color: obsidian,
  });

  // Right Panel Corner Filigree Accents
  drawCornerDiamond(383, 23);
  drawCornerDiamond(697, 23);
  drawCornerDiamond(383, 481);
  drawCornerDiamond(697, 481);

  // Unboxing Ceremony Header
  const insideBadge = 'THE UNBOXING CEREMONY';
  page.drawText(insideBadge, {
    x: 540 - (helvetica.widthOfTextAtSize(insideBadge, 7) / 2),
    y: 454,
    size: 7,
    font: helvetica,
    color: amber,
  });

  const insideTitle = 'A Living Memoir in Sound & Light';
  page.drawText(insideTitle, {
    x: 540 - (playfairFont.widthOfTextAtSize(insideTitle, 14) / 2),
    y: 432,
    size: 14,
    font: playfairFont,
    color: gold,
  });

  // Right Panel Decorative Divider
  page.drawLine({ start: { x: 430, y: 418 }, end: { x: 525, y: 418 }, thickness: 0.75, color: mutedGold });
  drawCornerDiamond(540, 418);
  page.drawLine({ start: { x: 555, y: 418 }, end: { x: 650, y: 418 }, thickness: 0.75, color: mutedGold });

  // Dedication Salutation & Prose Container
  const proseBoxX = 404;
  const proseBoxWidth = 272;
  const proseBoxY = 262;
  const proseBoxHeight = 142;

  page.drawRectangle({
    x: proseBoxX,
    y: proseBoxY,
    width: proseBoxWidth,
    height: proseBoxHeight,
    borderColor: rgb(0.2, 0.18, 0.12),
    borderWidth: 0.75,
    color: slateCard,
  });

  // Inside greeting
  const greetingText = `Dear ${cleanRecipient},`;
  const insideGreetFont = resolveFont(greetingText, fontBundle);
  page.drawText(greetingText, {
    x: proseBoxX + 14,
    y: proseBoxY + proseBoxHeight - 20,
    size: 10.5,
    font: insideGreetFont,
    color: goldLight,
  });

  // Dedication Prose lines
  const rawProse = voucher.giftMessage || 
    'A gift of living history to capture and preserve your life’s memories for our family. May your voice and stories be cherished for generations to come.';
  const wrappedLines = wrapProse(rawProse, 38).slice(0, 5);
  let proseY = proseBoxY + proseBoxHeight - 38;

  for (const line of wrappedLines) {
    const lineFont = resolveFont(line, fontBundle);
    page.drawText(line, {
      x: proseBoxX + 14,
      y: proseY,
      size: 8.5,
      font: lineFont,
      color: offWhite,
    });
    proseY -= 14;
  }

  // Giver Sign-off inside prose box
  const signOff = `— With love, ${cleanGiver}`;
  const signOffFont = resolveFont(signOff, fontBundle);
  page.drawText(signOff, {
    x: proseBoxX + proseBoxWidth - signOffFont.widthOfTextAtSize(signOff, 8.5) - 14,
    y: proseBoxY + 12,
    size: 8.5,
    font: signOffFont,
    color: amber,
  });

  // ───────────────────────────────────────────────────────────────────────────
  // THEATRICAL UNBOXING PORTAL: QR CODE & CROCKFORD TOKEN
  // ───────────────────────────────────────────────────────────────────────────

  // Embossed 35mm Cinema Film Cell Icon Vector Above QR Code
  const qrTopY = 246;
  // Vector Film Strip Banner above QR
  page.drawRectangle({
    x: 516,
    y: qrTopY - 4,
    width: 48,
    height: 12,
    borderColor: gold,
    borderWidth: 1,
    color: obsidian,
  });
  // Sprocket holes along top and bottom
  for (let i = 0; i < 4; i++) {
    page.drawRectangle({ x: 519 + (i * 11), y: qrTopY + 5, width: 3.5, height: 2, color: gold });
    page.drawRectangle({ x: 519 + (i * 11), y: qrTopY - 3, width: 3.5, height: 2, color: gold });
  }
  // Two small inner apertures
  page.drawRectangle({ x: 524, y: qrTopY - 0.5, width: 14, height: 5, color: goldLight });
  page.drawRectangle({ x: 542, y: qrTopY - 0.5, width: 14, height: 5, color: goldLight });

  // Generate High-Density QR Code
  const qrTargetUrl = `https://memoryweaver.studio/unboxing/${voucher.code}`;
  const qrPngBuffer = await QRCode.toBuffer(qrTargetUrl, {
    type: 'png',
    margin: 1,
    width: 360,
    color: {
      dark: '#121212', // Obsidian dark modules
      light: '#FAF6EE', // Warm gold parchment background
    },
    errorCorrectionLevel: 'H',
  });
  const qrBytes = new Uint8Array(qrPngBuffer.buffer, qrPngBuffer.byteOffset, qrPngBuffer.byteLength);
  const qrImage = await doc.embedPng(qrBytes);

  const qrSize = 92;
  const qrX = 540 - (qrSize / 2);
  const qrY = 132;

  // QR Gold Double Mounting Border
  page.drawRectangle({
    x: qrX - 4,
    y: qrY - 4,
    width: qrSize + 8,
    height: qrSize + 8,
    borderColor: gold,
    borderWidth: 1.5,
    color: rgb(250 / 255, 246 / 255, 238 / 255),
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // Crockford Base32 Human-Readable Token
  const tokenLabel = voucher.code;
  page.drawText(tokenLabel, {
    x: 540 - (helveticaBold.widthOfTextAtSize(tokenLabel, 11) / 2),
    y: 104,
    size: 11,
    font: helveticaBold,
    color: gold,
  });

  // Action Directive
  const stepAction = 'Scan QR Code or visit:';
  page.drawText(stepAction, {
    x: 540 - (helvetica.widthOfTextAtSize(stepAction, 7.5) / 2),
    y: 88,
    size: 7.5,
    font: helvetica,
    color: textMuted,
  });

  const portalUrl = 'memoryweaver.studio/unboxing';
  page.drawText(portalUrl, {
    x: 540 - (helveticaBold.widthOfTextAtSize(portalUrl, 8.5) / 2),
    y: 74,
    size: 8.5,
    font: helveticaBold,
    color: amber,
  });

  // Bottom Instructions & Compatibility
  const reqNotice = 'Soundstage requires tablet or PC • Plays on any phone or Smart TV';
  page.drawText(reqNotice, {
    x: 540 - (helvetica.widthOfTextAtSize(reqNotice, 6) / 2),
    y: 44,
    size: 6,
    font: helvetica,
    color: rgb(0.6, 0.55, 0.45),
  });

  const serialNotice = `VAULT TOKEN: ${voucher.code} • AUTHORISED FOR REDEMPTION`;
  page.drawText(serialNotice, {
    x: 540 - (helvetica.widthOfTextAtSize(serialNotice, 5) / 2),
    y: 34,
    size: 5,
    font: helvetica,
    color: rgb(0.4, 0.38, 0.32),
  });

  return await doc.save({ useObjectStreams: false });
}
