#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const PRODUCTS_DIR = new URL("../src/content/products", import.meta.url).pathname;
const OUT_PATH = new URL("../src/data/og-manifest.json", import.meta.url).pathname;

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    return yaml.load(match[1]);
}

function build() {
    if (!existsSync(PRODUCTS_DIR)) {
        console.log("Products directory not found:", PRODUCTS_DIR);
        writeFileSync(OUT_PATH, "{}");
        return;
    }

    const files = readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith(".md"));
    const manifest = {};

    for (const file of files) {
        const content = readFileSync(join(PRODUCTS_DIR, file), "utf-8");
        const data = parseFrontmatter(content);
        if (!data || !data.slug) continue;

        const slug = data.slug;
        const images = data.images || [];
        const rawVariants = data.variants || [];

        const variants = {};
        for (const v of rawVariants) {
            variants[v.key] = { images: v.images || [] };
        }

        manifest[slug] = { images, variants };
    }

    writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2));
    const count = Object.keys(manifest).length;
    console.log("OG manifest written:", OUT_PATH, `(${count} products)`);
}

build();
