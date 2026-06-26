import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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

const materials = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/materials" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        icon: z.string().default("🔩"),
        order: z.number().default(0),
    }),
});

const categories = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/categories" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        icon: z.string().default("📦"),
        order: z.number().default(0),
        image: z.string().optional(),
        description: localizedString.optional(),
        promoted: z.boolean().default(false),
    }),
});

const products = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        description: localizedString,
        images: z.array(z.string()),
        category: z.string(),
        material: z.string(),
        basePrice: z.number(),
        stock: z.number().int().default(0),
        inStock: z.boolean().default(true),
        featured: z.boolean().default(false),
        discount: discountSchema.default({ active: false, type: "percentage", value: 0 }),
        specifications: z
            .array(
                z.object({
                    label: localizedString,
                    value: localizedString,
                }),
            )
            .default([]),
        attributeGroups: z
            .array(
                z.object({
                    name: localizedString,
                    options: z.array(
                        z.object({
                            label: localizedString,
                        }),
                    ),
                }),
            )
            .default([]),
        variants: z
            .array(
                z.object({
                    key: z.string(),
                    attributeValues: z.array(
                        z.object({
                            group: z.string(),
                            option: z.string(),
                        }),
                    ),
                    priceModifier: z.number().default(0),
                    discount: discountSchema.default({ active: false, type: "percentage", value: 0 }),
                    images: z.array(z.string()).optional(),
                    specifications: z
                        .array(
                            z.object({
                                label: localizedString,
                                value: localizedString,
                            }),
                        )
                        .default([]),
                    stock: z.number().int().default(0),
                    inStock: z.boolean().default(true),
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
    loader: glob({ pattern: "**/*.md", base: "./src/content/settings" }),
    schema: z.object({
        whatsappNumber: z.string().default("9779861760709"),
        messengerPage: z.string().default("metalhub.np"),
    }),
});

const i18nCollection = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/i18n" }),
    schema: z.object({
        key: z.string(),
        en: z.string(),
        ne: z.string(),
        newa: z.string(),
    }),
});

export const collections = { materials, categories, products, settings, i18n: i18nCollection };
