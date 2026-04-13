// Generates PWA icons as simple PNG files
// Run: node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");

// Minimal 1x1 purple PNG generator using raw bytes
// We'll create proper SVG-based icons that browsers can use

const sizes = [192, 512];

const createSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,-apple-system,sans-serif" font-weight="800"
        font-size="${size * 0.38}" fill="white" letter-spacing="-0.02em">PF</text>
</svg>`;

const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of sizes) {
    const svg = createSVG(size);
    const svgPath = path.join(iconsDir, `icon-${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`Created ${svgPath}`);
}

console.log("\nSVG icons created! For production PNG icons, convert these SVGs using any image tool.");
console.log("Browsers support SVG icons in manifests, but for maximum iOS compatibility,");
console.log("consider converting to PNG with: npx svg2png-many public/icons/");
