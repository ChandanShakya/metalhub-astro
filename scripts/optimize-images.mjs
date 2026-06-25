#!/usr/bin/env node
/**
 * Pre-build image optimizer.
 *
 * Walks public/images/products/ and converts all JPEG/PNG images to WebP
 * using sharp. Keeps originals as fallback for browsers that don't support
 * WebP (handled by <picture> in OptimizedImage.astro).
 *
 * Skips conversion when the WebP output already exists and is newer than
 * the source file.
 */

import { readdirSync, statSync, existsSync } from "fs";
import { join, extname, parse } from "path";
import sharp from "sharp";

const ROOT = new URL("../public/images/products", import.meta.url).pathname;
const QUALITY = 80;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

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
    const outPath = join(dir, `${name}.webp`);

    // Skip if output already exists and is newer than source
    if (existsSync(outPath)) {
        const srcMtime = statSync(srcPath).mtimeMs;
        const outMtime = statSync(outPath).mtimeMs;
        if (outMtime >= srcMtime) {
            skipped++;
            return;
        }
    }

    try {
        await sharp(srcPath).webp({ quality: QUALITY }).toFile(outPath);
        converted++;
        const srcSize = statSync(srcPath).size;
        const outSize = statSync(outPath).size;
        const saved = ((1 - outSize / srcSize) * 100).toFixed(1);
        console.log(
            `  ✓ ${name}${extname(srcPath)} → ${name}.webp  (${(srcSize / 1024).toFixed(0)}K → ${(outSize / 1024).toFixed(0)}K, -${saved}%)`,
        );
    } catch (err) {
        console.error(`  ✗ ${name}: ${err.message}`);
        errors++;
    }
}

console.log(`Optimizing images in ${ROOT}...\n`);
const all = walk(ROOT);
await Promise.all(all);
console.log(
    `\nDone: ${converted} converted, ${skipped} skipped, ${errors} errors`,
);

if (errors > 0) process.exit(1);
