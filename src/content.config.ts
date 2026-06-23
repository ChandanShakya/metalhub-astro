import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: z.object({
    slug: z.string(),
    name: z.object({
      en: z.string(),
      ne: z.string(),
      newa: z.string()
    }),
    icon: z.string().default('📦'),
    order: z.number().default(0)
  })
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    slug: z.string(),
    name: z.object({
      en: z.string(),
      ne: z.string(),
      newa: z.string()
    }),
    description: z.object({
      en: z.string(),
      ne: z.string(),
      newa: z.string()
    }),
    images: z.array(z.string()),
    category: z.string(),
    basePrice: z.number(),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
    discount: z.object({
      active: z.boolean().default(false),
      type: z.enum(['percentage', 'flat']).default('percentage'),
      value: z.number().default(0)
    }).default({ active: false, type: 'percentage', value: 0 }),
    attributes: z.array(z.object({
      name: z.string(),
      options: z.array(z.object({
        label: z.string(),
        priceModifier: z.number().default(0),
        discount: z.object({
          active: z.boolean().default(false),
          type: z.enum(['percentage', 'flat']).default('percentage'),
          value: z.number().default(0)
        }).optional()
      }))
    })).default([])
  })
});

const socialHighlights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/social-highlights' }),
  schema: z.object({
    platform: z.enum(['instagram', 'tiktok']),
    embedCode: z.string(),
    caption: z.string().default(''),
    order: z.number().default(0)
  })
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/settings' }),
  schema: z.object({
    whatsappNumber: z.string().default('9779861760709'),
    messengerPage: z.string().default('metalhub.np')
  })
});

export const collections = { categories, products, socialHighlights, settings };
