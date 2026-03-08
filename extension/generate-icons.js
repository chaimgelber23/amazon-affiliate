// Run with: node generate-icons.js
// Generates icon16.png, icon48.png, icon128.png in ./icons/
// Requires: npm install canvas  (or run: npx --yes canvas)

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

const sizes = [16, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background: indigo rounded square
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#6366f1");
  grad.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = grad;
  ctx.fill();

  // Text "PF"
  const fontSize = Math.round(size * 0.38);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PF", size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer("image/png");
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Written: ${outPath}`);
}
console.log("Icons generated!");
