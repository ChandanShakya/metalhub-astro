import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const categories = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/categories" }),
    schema: z.object({
        slug: z.string(),
        name: z.object({
            en: z.string(),
            ne: z.string(),
            newa: z.string(),
        }),
        icon: z.string().default("📦"),
        order: z.number().default(0),
    }),
});

const localizedString = z.object({
    en: z.string(),
    ne: z.string(),
    newa: z.string(),
});

const discountSchema = z.object({
    active: z.boolean().default(false),
    type: z.enum(["percentage", "flat"]).default("percentage"),
    value: z.number().default(0),
});

const products = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        description: localizedString,
        images: z.array(z.string()),
        category: z.string(),
        basePrice: z.number(),
        inStock: z.boolean().default(true),
        featured: z.boolean().default(false),
        discount: discountSchema.default({ active: false, type: "percentage", value: 0 }),
        attributes: z
            .array(
                z.object({
                    name: localizedString,
                    options: z.array(
                        z.object({
                            label: localizedString,
                            priceModifier: z.number().default(0),
                            discount: discountSchema.optional(),
                            images: z.array(z.string()).optional(),
                        }),
                    ),
                }),
            )
            .default([]),
        socialEmbeds: z
            .array(
                z.object({
                    platform: z.enum(["facebook", "instagram", "tiktok"]),
                    embedCode: z.string(),
                }),
            )
            .default([]),
    }),
});

const settings = defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/settings" }),
    schema: z.object({
        whatsappNumber: z.string().default("9779861760709"),
        messengerPage: z.string().default("metalhub.np"),
    }),
});

const i18nCollection = defineCollection({
    loader: glob({ pattern: "**/*.json", base: "./src/content/i18n" }),
    schema: z.object({
        key: z.string(),
        en: z.record(z.string(), z.string()),
        ne: z.record(z.string(), z.string()),
        newa: z.record(z.string(), z.string()),
    }),
});

export const collections = { categories, products, settings, i18n: i18nCollection };
