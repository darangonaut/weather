const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="512" height="512" rx="128" fill="#020617"/>
      
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#22d3ee;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#818cf8;stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="20" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
        </radialGradient>
      </defs>

      <!-- Decorative abstract shapes -->
      <circle cx="256" cy="256" r="180" fill="url(#sunGrad)" opacity="0.1" />
      <circle cx="256" cy="256" r="140" fill="url(#sunGrad)" opacity="0.15" />

      <!-- Main Sun/AI Core -->
      <g filter="url(#glow)">
        <circle cx="256" cy="256" r="90" fill="url(#sunGrad)" />
        <circle cx="256" cy="256" r="90" fill="url(#innerGlow)" />
      </g>

      <!-- Digital Rays / AI Nodes -->
      <g stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.6">
        <line x1="256" y1="120" x2="256" y2="150" />
        <line x1="256" y1="362" x2="256" y2="392" />
        <line x1="120" y1="256" x2="150" y2="256" />
        <line x1="362" y1="256" x2="392" y2="256" />
        
        <line x1="160" y1="160" x2="181" y2="181" />
        <line x1="331" y1="331" x2="352" y2="352" />
        <line x1="352" y1="160" x2="331" y2="181" />
        <line x1="181" y1="331" x2="160" y2="352" />
      </g>

      <!-- Small sparkle points -->
      <circle cx="180" cy="256" r="4" fill="white" />
      <circle cx="332" cy="256" r="4" fill="white" />
      <circle cx="256" cy="180" r="4" fill="white" />
      <circle cx="256" cy="332" r="4" fill="white" />
    </svg>
  `;

  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
  }

  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192x192.png');

  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512x512.png');

  console.log('PWA ikony boli úspešne vygenerované v /public');
}

generateIcons().catch(console.error);
