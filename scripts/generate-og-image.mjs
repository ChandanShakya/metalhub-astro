#!/usr/bin/env node
import sharp from "sharp";
import { existsSync } from "fs";
import { join } from "path";

const OUT_DIR = new URL("../public/images", import.meta.url).pathname;
const OUT_PATH = join(OUT_DIR, "og-default.jpg");

async function main() {
  const width = 1200;
  const height = 630;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f2937"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
        <radialGradient id="glow1" cx="20%" cy="30%" r="50%">
          <stop offset="0%" stop-color="rgba(180,83,9,0.15)"/>
          <stop offset="100%" stop-color="rgba(180,83,9,0)"/>
        </radialGradient>
        <radialGradient id="glow2" cx="80%" cy="70%" r="40%">
          <stop offset="0%" stop-color="rgba(217,119,6,0.1)"/>
          <stop offset="100%" stop-color="rgba(217,119,6,0)"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#glow1)"/>
      <rect width="${width}" height="${height}" fill="url(#glow2)"/>
      <line x1="100" y1="280" x2="1100" y2="280" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="100" y1="350" x2="1100" y2="350" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <text x="600" y="260" text-anchor="middle" font-family="Inter, sans-serif" font-size="72" font-weight="800" fill="#f5f5f4" letter-spacing="2">
        Metal Hub
      </text>
      <text x="600" y="330" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="400" fill="#d97706" letter-spacing="6" text-transform="uppercase">
        HANDCRAFTED IN KATHMANDU
      </text>
      <text x="600" y="400" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="300" fill="rgba(255,255,255,0.6)">
        Copper · Brass · Bronze Kitchenware
      </text>
      <circle cx="600" cy="480" r="2" fill="#d97706"/>
    </svg>
  `;

  const svgBuffer = Buffer.from(svg);

  await sharp(svgBuffer)
    .jpeg({ quality: 92 })
    .toFile(OUT_PATH);

  console.log(`✅ OG image created: ${OUT_PATH}`);
}

main().catch(console.error);
