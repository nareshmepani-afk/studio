/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const artifactDir = 'C:\\Users\\home\\.gemini\\antigravity\\brain\\1cbc737f-f07c-4196-9b58-21073f00e3f6';

const svgDark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <defs>
    <!-- Radial Dark Luxury Canvas -->
    <radialGradient id="bg-radial" cx="30%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="60%" stop-color="#080a0f" />
      <stop offset="100%" stop-color="#030712" />
    </radialGradient>

    <!-- Champagne Gold Metallic Gradient -->
    <linearGradient id="champagne-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5" />
      <stop offset="25%" stop-color="#F7E7CE" />
      <stop offset="50%" stop-color="#EAD08C" />
      <stop offset="75%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA820A" />
    </linearGradient>

    <!-- Champagne Soft Subtitle Gradient -->
    <linearGradient id="champagne-soft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F7E7CE" />
      <stop offset="50%" stop-color="#EAD08C" />
      <stop offset="100%" stop-color="#FAF0E6" />
    </linearGradient>

    <!-- Luxury Hairline Divider -->
    <linearGradient id="gold-hairline" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F7E7CE" stop-opacity="0.8" />
      <stop offset="60%" stop-color="#D4AF37" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0" />
    </linearGradient>

    <!-- Border Accent Glow -->
    <linearGradient id="border-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.6" />
    </linearGradient>

    <filter id="subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="1200" height="300" rx="36" fill="url(#bg-radial)" />
  <rect width="1194" height="294" x="3" y="3" rx="33" fill="none" stroke="url(#border-glow)" stroke-width="1.5" />

  <!-- Left: Official Film Strip Medallion -->
  <g filter="url(#subtle-glow)">
    <rect x="60" y="50" width="200" height="200" rx="44" fill="#000000" stroke="#1e293b" stroke-width="2" />
    <rect x="64" y="54" width="192" height="192" rx="40" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-opacity="0.25" />

    <!-- Official Film Strip Icon (Cyan) -->
    <g fill="none" stroke="#0ea5e9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
      <rect x="98" y="88" width="124" height="124" rx="14" />
      <line x1="129" y1="88" x2="129" y2="212" />
      <line x1="191" y1="88" x2="191" y2="212" />
      <line x1="98" y1="150" x2="222" y2="150" />
      <line x1="98" y1="119" x2="129" y2="119" />
      <line x1="98" y1="181" x2="129" y2="181" />
      <line x1="191" y1="119" x2="222" y2="119" />
      <line x1="191" y1="181" x2="222" y2="181" />
    </g>
  </g>

  <!-- Right: Typography Wordmark -->
  <!-- Main Title: Memory (Pure Crisp White) Weaver (Champagne Gold) -->
  <text x="295" y="148" font-family="'Cinzel', 'Playfair Display', 'Georgia', 'Segoe UI', 'Inter', sans-serif" font-size="76" font-weight="800" letter-spacing="1.5" filter="url(#subtle-glow)">
    <tspan fill="#FFFFFF">Memory </tspan>
    <tspan fill="url(#champagne-gold)">Weaver</tspan>
  </text>

  <!-- Luxury Accent Hairline -->
  <line x1="298" y1="176" x2="1060" y2="176" stroke="url(#gold-hairline)" stroke-width="1.5" />

  <!-- Subtitle Descriptor: Champagne Gold -->
  <text x="300" y="216" font-family="'Inter', 'Segoe UI', system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="7.5" fill="url(#champagne-soft)" text-transform="uppercase" opacity="0.92">
    CINEMATIC ORAL LEGACY STUDIO
  </text>
</svg>`;

const svgTrans = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <defs>
    <!-- Champagne Gold Metallic Gradient -->
    <linearGradient id="champagne-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5" />
      <stop offset="25%" stop-color="#F7E7CE" />
      <stop offset="50%" stop-color="#EAD08C" />
      <stop offset="75%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#AA820A" />
    </linearGradient>

    <!-- Champagne Soft Subtitle Gradient -->
    <linearGradient id="champagne-soft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F7E7CE" />
      <stop offset="50%" stop-color="#EAD08C" />
      <stop offset="100%" stop-color="#FAF0E6" />
    </linearGradient>

    <!-- Luxury Hairline Divider -->
    <linearGradient id="gold-hairline" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F7E7CE" stop-opacity="0.8" />
      <stop offset="60%" stop-color="#D4AF37" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0" />
    </linearGradient>

    <filter id="subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <!-- Left: Official Film Strip Medallion -->
  <g filter="url(#subtle-glow)">
    <rect x="60" y="50" width="200" height="200" rx="44" fill="#000000" stroke="#1e293b" stroke-width="2" />
    <rect x="64" y="54" width="192" height="192" rx="40" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-opacity="0.25" />

    <!-- Official Film Strip Icon (Cyan) -->
    <g fill="none" stroke="#0ea5e9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
      <rect x="98" y="88" width="124" height="124" rx="14" />
      <line x1="129" y1="88" x2="129" y2="212" />
      <line x1="191" y1="88" x2="191" y2="212" />
      <line x1="98" y1="150" x2="222" y2="150" />
      <line x1="98" y1="119" x2="129" y2="119" />
      <line x1="98" y1="181" x2="129" y2="181" />
      <line x1="191" y1="119" x2="222" y2="119" />
      <line x1="191" y1="181" x2="222" y2="181" />
    </g>
  </g>

  <!-- Right: Typography Wordmark -->
  <!-- Main Title: Memory (Pure Crisp White) Weaver (Champagne Gold) -->
  <text x="295" y="148" font-family="'Cinzel', 'Playfair Display', 'Georgia', 'Segoe UI', 'Inter', sans-serif" font-size="76" font-weight="800" letter-spacing="1.5" filter="url(#subtle-glow)">
    <tspan fill="#FFFFFF">Memory </tspan>
    <tspan fill="url(#champagne-gold)">Weaver</tspan>
  </text>

  <!-- Luxury Accent Hairline -->
  <line x1="298" y1="176" x2="1060" y2="176" stroke="url(#gold-hairline)" stroke-width="1.5" />

  <!-- Subtitle Descriptor: Champagne Gold -->
  <text x="300" y="216" font-family="'Inter', 'Segoe UI', system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="7.5" fill="url(#champagne-soft)" text-transform="uppercase" opacity="0.92">
    CINEMATIC ORAL LEGACY STUDIO
  </text>
</svg>`;

// Write SVGs
fs.writeFileSync(path.join('public', 'logo-wordmark-horizontal.svg'), svgDark, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'logo-wordmark-horizontal.svg'), svgDark, 'utf8');

fs.writeFileSync(path.join('public', 'logo-wordmark-transparent.svg'), svgTrans, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'logo-wordmark-transparent.svg'), svgTrans, 'utf8');

async function convertAll() {
  const bufDark = Buffer.from(svgDark);
  const bufTrans = Buffer.from(svgTrans);

  // 1. PNGs
  await sharp(bufDark).png({ quality: 100 }).toFile(path.join('public', 'logo-wordmark-horizontal.png'));
  await sharp(bufDark).png({ quality: 100 }).toFile(path.join(artifactDir, 'logo-wordmark-horizontal.png'));
  
  await sharp(bufTrans).png({ quality: 100 }).toFile(path.join('public', 'logo-wordmark-transparent.png'));
  await sharp(bufTrans).png({ quality: 100 }).toFile(path.join(artifactDir, 'logo-wordmark-transparent.png'));

  // 2. JPGs
  await sharp(bufDark).jpeg({ quality: 100 }).toFile(path.join('public', 'logo-wordmark-horizontal.jpg'));
  await sharp(bufDark).jpeg({ quality: 100 }).toFile(path.join(artifactDir, 'logo-wordmark-horizontal.jpg'));

  // 3. JPEGs
  await sharp(bufDark).jpeg({ quality: 100 }).toFile(path.join('public', 'logo-wordmark-horizontal.jpeg'));
  await sharp(bufDark).jpeg({ quality: 100 }).toFile(path.join(artifactDir, 'logo-wordmark-horizontal.jpeg'));

  console.log('Successfully generated Horizontal Wordmark in SVG, PNG, JPG, JPEG!');
}

convertAll().catch(console.error);
