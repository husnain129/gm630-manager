import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

// ── SVG designs ───────────────────────────────────────────────────────────────

// Main icon: blue gradient background + white wifi arcs + small router base
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="100%" style="stop-color:#2563eb"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0"/>
    </linearGradient>
  </defs>

  <!-- Rounded square background -->
  <rect width="1024" height="1024" rx="220" ry="220" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <rect width="1024" height="600" rx="220" ry="220" fill="url(#glow)" opacity="0.5"/>

  <!-- WiFi arcs (centered at 512, 570) -->
  <!-- Outermost arc -->
  <path d="M 195 455 A 360 360 0 0 1 829 455"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round" opacity="0.95"/>

  <!-- Middle arc -->
  <path d="M 293 530 A 240 240 0 0 1 731 530"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round" opacity="0.95"/>

  <!-- Inner arc -->
  <path d="M 392 608 A 120 120 0 0 1 632 608"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round" opacity="0.95"/>

  <!-- Center dot -->
  <circle cx="512" cy="686" r="52" fill="white"/>

  <!-- Router base (subtle) -->
  <rect x="340" y="790" width="344" height="44" rx="22" fill="white" opacity="0.25"/>
  <rect x="428" y="834" width="168" height="32" rx="10" fill="white" opacity="0.18"/>

  <!-- Small antenna dots on router base -->
  <circle cx="428" cy="790" r="10" fill="white" opacity="0.3"/>
  <circle cx="596" cy="790" r="10" fill="white" opacity="0.3"/>
</svg>
`;

// Foreground icon for Android adaptive (no background, just the symbol centered with padding)
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- WiFi arcs centered -->
  <path d="M 195 430 A 360 360 0 0 1 829 430"
        fill="none" stroke="#2563eb" stroke-width="68" stroke-linecap="round"/>
  <path d="M 293 508 A 240 240 0 0 1 731 508"
        fill="none" stroke="#2563eb" stroke-width="68" stroke-linecap="round"/>
  <path d="M 392 586 A 120 120 0 0 1 632 586"
        fill="none" stroke="#2563eb" stroke-width="68" stroke-linecap="round"/>
  <circle cx="512" cy="664" r="52" fill="#2563eb"/>
</svg>
`;

// Monochrome icon (all white, used for Android themed icons)
const monochromeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="M 195 430 A 360 360 0 0 1 829 430"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round"/>
  <path d="M 293 508 A 240 240 0 0 1 731 508"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round"/>
  <path d="M 392 586 A 120 120 0 0 1 632 586"
        fill="none" stroke="white" stroke-width="68" stroke-linecap="round"/>
  <circle cx="512" cy="664" r="52" fill="white"/>
</svg>
`;

// Splash icon: just the wifi symbol, no background (shown on white splash)
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <path d="M 20 155 A 190 190 0 0 1 380 155"
        fill="none" stroke="#2563eb" stroke-width="36" stroke-linecap="round"/>
  <path d="M 70 213 A 130 130 0 0 1 330 213"
        fill="none" stroke="#2563eb" stroke-width="36" stroke-linecap="round"/>
  <path d="M 122 270 A 78 78 0 0 1 278 270"
        fill="none" stroke="#2563eb" stroke-width="36" stroke-linecap="round"/>
  <circle cx="200" cy="328" r="30" fill="#2563eb"/>
</svg>
`;

// Favicon (32x32 equivalent design at 48px)
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" fill="#2563eb"/>
  <path d="M 6 18 A 21 21 0 0 1 42 18"
        fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>
  <path d="M 11 25 A 14 14 0 0 1 37 25"
        fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>
  <path d="M 16 32 A 8 8 0 0 1 32 32"
        fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>
  <circle cx="24" cy="39" r="4" fill="white"/>
</svg>
`;

async function generate() {
  const base = '/Users/muhammadh./Desktop/projects/experiments/router-app/assets/images';

  console.log('Generating icon.png (1024x1024)...');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(`${base}/icon.png`);

  console.log('Generating android-icon-foreground.png (1024x1024)...');
  await sharp(Buffer.from(foregroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(`${base}/android-icon-foreground.png`);

  console.log('Generating android-icon-monochrome.png (1024x1024)...');
  await sharp(Buffer.from(monochromeSvg))
    .resize(1024, 1024)
    .png()
    .toFile(`${base}/android-icon-monochrome.png`);

  console.log('Generating splash-icon.png (400x400)...');
  await sharp(Buffer.from(splashSvg))
    .resize(400, 400)
    .png()
    .toFile(`${base}/splash-icon.png`);

  console.log('Generating favicon.png (48x48)...');
  await sharp(Buffer.from(faviconSvg))
    .resize(48, 48)
    .png()
    .toFile(`${base}/favicon.png`);

  console.log('All icons generated.');
}

generate().catch(console.error);
