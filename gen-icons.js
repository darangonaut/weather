const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="100" fill="#0f172a"/>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="200" fill="url(#grad)" opacity="0.2" />
      <path d="M256 120 L320 256 L256 392 L192 256 Z" fill="white" />
      <circle cx="256" cy="256" r="60" fill="white" opacity="0.9" />
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
