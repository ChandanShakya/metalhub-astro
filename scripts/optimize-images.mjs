#!/usr/bin/env node
/**
 * Pre-build image optimizer.
 *
 * Walks public/images/products/ and:
 * 1. Converts JPEG/PNG → WebP at multiple widths (300w, 600w, 900w, 1200w)
 *    for responsive srcset support.
 * 2. Keeps originals as fallback for browsers without WebP.
 *
 * Skips regeneration when all outputs exist and are newer than the source.
 */

import { readdirSync, statSync, existsSync } from "fs";
import { join, extname, parse } from "path";
import sharp from "sharp";

const ROOT = new URL("../public/images/products", import.meta.url).pathname;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

/** Target widths for responsive srcset */
const WIDTHS = [300, 600, 900, 1200];

/**
 * WebP quality per width band.
 * Smaller widths can use slightly lower quality since they're displayed smaller.
 */
function qualityForWidth(w) {
    if (w <= 300) return 65;
    if (w <= 600) return 70;
    if (w <= 900) return 72;
    return 75;
}

let converted = 0;
let skipped = 0;
let errors = 0;

function walk(dir) {
    const promises = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return promises;
    }
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            promises.push(...walk(fullPath));
        } else if (entry.isFile()) {
            const ext = extname(entry.name).toLowerCase();
            if (EXTENSIONS.has(ext)) {
                promises.push(processFile(fullPath));
            }
        }
    }
    return promises;
}

async function processFile(srcPath) {
    const { dir, name } = parse(srcPath);
    const srcExt = extname(srcPath);
    const metadata = await sharp(srcPath).metadata();
    const origWidth = metadata.width;

    const tasks = WIDTHS.map(async (w) => {
        // Only generate sizes smaller than the original
        if (origWidth && w >= origWidth) return null;

        const outName = `${name}-${w}w.webp`;
        const outPath = join(dir, outName);

        if (existsSync(outPath)) {
            const srcMtime = statSync(srcPath).mtimeMs;
            const outMtime = statSync(outPath).mtimeMs;
            if (outMtime >= srcMtime) return null;
        }

        const quality = qualityForWidth(w);
        await sharp(srcPath)
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality })
            .toFile(outPath);
        return { name: outName, width: w, quality };
    });

    const results = await Promise.all(tasks);
    const done = results.filter(Boolean);

    // Also generate the fallback full-size WebP (no resize, lower quality)
    const fullWebp = join(dir, `${name}.webp`);
    const needsFull = !existsSync(fullWebp) ||
        statSync(fullWebp).mtimeMs < statSync(srcPath).mtimeMs;
    if (needsFull) {
        await sharp(srcPath).webp({ quality: 72 }).toFile(fullWebp);
        done.push({ name: `${name}.webp`, width: "full", quality: 72 });
    }

    converted += done.length;
    if (done.length > 0) {
        const sizes = done.map((d) => d.width === "full" ? "full" : `${d.width}w`).join(", ");
        console.log(`  ✓ ${name}${srcExt} → [${sizes}]`);
    }
}

console.log(`Optimizing images in ${ROOT}...\n`);
console.log(`Responsive widths: ${WIDTHS.join("w, ")}w\n`);
const all = walk(ROOT);
await Promise.all(all);
console.log(
    `\nDone: ${converted} generated, ${skipped} up-to-date, ${errors} errors`,
);

if (errors > 0) process.exit(1);
