# Metal Hub — Full Site Redesign Plan

> Documenting the complete data model restructure, homepage redesign, and new features
> inspired by [Axiakrafts.com](https://axiakrafts.com/)

---

## Table of Contents

1. [Data Model Restructure](#1-data-model-restructure)
   - [1A. New Materials Collection](#1a-new-materials-collection)
   - [1B. Repurposed Categories — Functional Categories](#1b-repurposed-categories--functional-categories)
   - [1C. Product Schema — Variant-Based Attributes](#1c-product-schema--variant-based-attributes)
2. [Product Examples — New Format](#2-product-examples--new-format)
3. ["On Sale" — Variant-Level Computation](#3-on-sale--variant-level-computation)
4. [AttributeSelector Rewrite — Variant-Aware](#4-attributeselector-rewrite--variant-aware)
5. [Homepage Redesign — Section Order](#5-homepage-redesign--section-order)
6. [New Routes](#6-new-routes)
7. [New Components](#7-new-components)
8. [Reviews — Dynamic Plugin](#8-reviews--dynamic-plugin)
9. [Migration Path — Existing Products](#9-migration-path--existing-products)
10. [Full File Change List](#10-full-file-change-list)
11. [Implementation Order](#11-implementation-order)
12. [Performance Budget](#12-performance-budget)

---

## 1. Data Model Restructure

### 1A. New Materials Collection

New content collection separate from categories. Same shape as current categories.

**Schema** (`src/content.config.ts`):

```ts
const materials = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/materials" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        icon: z.string().default("🔩"),
        order: z.number().default(0),
    }),
});
```

**Initial content files:**

```yaml
# src/content/materials/copper.md
slug: copper
name:
  en: Copper
  ne: तामा
  newa: तामा
icon: 🟤
order: 1
---
```

```yaml
# src/content/materials/brass.md
slug: brass
name:
  en: Brass
  ne: ब्रास
  newa: पित्तल
icon: 🟡
order: 2
---
```

```yaml
# src/content/materials/bronze.md
slug: bronze
name:
  en: Bronze
  ne: काँस
  newa: काँस
icon: 🟠
order: 3
---
```

**CMS config** (`public/admin/config.yml`):

```yaml
- name: materials
  label: Materials
  folder: src/content/materials
  create: true
  fields:
    - label: Name
      name: name
      widget: object
      fields:
        - { label: English, name: en, widget: string }
        - { label: Nepali, name: ne, widget: string }
        - { label: Newari, name: newa, widget: string }
    - { label: Slug, name: slug, widget: string }
    - { label: Icon, name: icon, widget: string, default: "🔩" }
    - { label: Order, name: order, widget: number, default: 0 }
```

---

### 1B. Repurposed Categories — Functional Categories

Categories change from "material types" to "functional categories" (Kitchenware, Puja Items, Home Decor, Gift Items, Statue, Corporate Gifts).

**New fields added:** `image` (banner), `description` (i18n), `promoted` (for Hot Topics).

**Schema** (`src/content.config.ts`):

```ts
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
        image: z.string().optional(),
        description: z.object({
            en: z.string(),
            ne: z.string(),
            newa: z.string(),
        }).optional(),
        promoted: z.boolean().default(false),
    }),
});
```

**Initial content:**

```yaml
# categories/kitchenware.md
slug: kitchenware
name: { en: Kitchenware, ne: भाँडाकुँडा, newa: ... }
icon: 🍳
order: 1
promoted: true
image: /images/categories/kitchenware.jpg
description: { en: Premium kitchen essentials, ne: ..., newa: ... }
---
```

```yaml
# categories/puja-items.md
slug: puja-items
name: { en: Puja Items, ne: पूजा सामग्री, newa: ... }
icon: 🪔
order: 2
promoted: true
---
```

```yaml
# categories/home-decor.md
slug: home-decor
name: { en: Home Decor, ne: गृह सजावट, newa: ... }
icon: 🏠
order: 3
promoted: true
---
```

```yaml
# categories/gift-items.md
slug: gift-items
name: { en: Gift Items, ne: उपहार, newa: ... }
icon: 🎁
order: 4
promoted: true
---
```

```yaml
# categories/statue.md
slug: statue
name: { en: Statue, ne: मूर्ति, newa: ... }
icon: 🗿
order: 5
---
```

```yaml
# categories/corporate-gifts.md
slug: corporate-gifts
name: { en: Corporate Gifts, ne: कर्पोरेट उपहार, newa: ... }
icon: 💼
order: 6
---
```

**CMS config update:**

```yaml
- name: categories
  fields:
    # ... existing name, slug, icon, order fields ...
    - { label: Image, name: image, widget: image, required: false, hint: "Category banner image for homepage" }
    - label: Description
      name: description
      widget: object
      required: false
      fields:
        - { label: English, name: en, widget: string }
        - { label: Nepali, name: ne, widget: string }
        - { label: Newari, name: newa, widget: string }
    - { label: Promoted (show in Hot Topics), name: promoted, widget: boolean, default: false }
```

---

### 1C. Product Schema — Variant-Based Attributes

The biggest change. Replaces flat independent `attributes[]` with:

- `attributeGroups[]` — defines the UI selector schema (names + options)
- `variants[]` — defines each valid combination with its own pricing, discount, stock, images

**New schema** (`src/content.config.ts`):

```ts
const products = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
    schema: z.object({
        slug: z.string(),
        name: localizedString,
        description: localizedString,
        images: z.array(z.string()),
        category: z.string(),                  // functional category slug (kitchenware, puja-items...)
        material: z.string(),                  // material slug (copper, brass, bronze...)
        basePrice: z.number(),                 // base price before any modifiers
        inStock: z.boolean().default(true),
        featured: z.boolean().default(false),
        discount: z.object({                   // product-level discount (fallback)
            active: z.boolean().default(false),
            type: z.enum(["percentage", "flat"]).default("percentage"),
            value: z.number().default(0),
        }).default({ active: false, type: "percentage", value: 0 }),

        // NEW — Product specifications (weight, dimensions, material, capacity...)
        specifications: z.array(z.object({
            label: localizedString,
            value: localizedString,
        })).default([]),

        // Attribute schema — defines the UI selectors
        attributeGroups: z.array(z.object({
            name: localizedString,
            options: z.array(z.object({
                label: localizedString,
            })),
        })).default([]),

        // Variants — each valid combination with pricing, discount, stock, images
        variants: z.array(z.object({
            key: z.string(),
            attributeValues: z.array(z.object({
                group: z.string(),   // attribute group English name (e.g. "Size")
                option: z.string(),  // option English label (e.g. "Small")
            })),
            priceModifier: z.number().default(0),
            discount: z.object({
                active: z.boolean().default(false),
                type: z.enum(["percentage", "flat"]).default("percentage"),
                value: z.number().default(0),
            }).default({ active: false, type: "percentage", value: 0 }),
            images: z.array(z.string()).optional(),
            inStock: z.boolean().default(true),
        })).default([]),

        socialEmbeds: z.array(z.object({
            platform: z.enum(["facebook", "instagram", "tiktok"]),
            embedCode: z.string(),
        })).default([]),
    }),
});
```

**CMS config for products** — new fields:

```yaml
- name: products
  fields:
    # ... existing name, slug, description fields ...

    - { label: Category, name: category, widget: string, hint: "Functional category slug (kitchenware, puja-items, home-decor, gift-items, statue, corporate-gifts)" }
    - { label: Material, name: material, widget: string, hint: "Material slug (copper, brass, bronze)" }
    - { label: Base Price (NPR), name: basePrice, widget: number }
    - { label: In Stock, name: inStock, widget: boolean, default: true }
    - { label: Featured, name: featured, widget: boolean, default: false }

    # Product-level discount (fallback when no variant discount applies)
    - label: Product Discount (fallback)
      name: discount
      widget: object
      fields:
        - { label: Active, name: active, widget: boolean, default: false }
        - { label: Type, name: type, widget: select, options: [percentage, flat] }
        - { label: Value, name: value, widget: number, default: 0 }

    # Specifications
    - label: Specifications
      name: specifications
      widget: list
      required: false
      fields:
        - label: Label
          name: label
          widget: object
          fields:
            - { label: English, name: en, widget: string, hint: "e.g. Weight, Height, Material" }
            - { label: Nepali, name: ne, widget: string }
            - { label: Newari, name: newa, widget: string }
        - label: Value
          name: value
          widget: object
          fields:
            - { label: English, name: en, widget: string, hint: "e.g. 0.654 kgs, 28 cms" }
            - { label: Nepali, name: ne, widget: string }
            - { label: Newari, name: newa, widget: string }

    # Attribute Groups (schema for UI selectors)
    - label: Attribute Groups
      name: attributeGroups
      widget: list
      required: false
      fields:
        - label: Group Name
          name: name
          widget: object
          fields:
            - { label: English, name: en, widget: string, hint: "e.g. Size, Finish" }
            - { label: Nepali, name: ne, widget: string }
            - { label: Newari, name: newa, widget: string }
        - label: Options
          name: options
          widget: list
          fields:
            - label: Label
              name: label
              widget: object
              fields:
                - { label: English, name: en, widget: string, hint: "e.g. Small, Large" }
                - { label: Nepali, name: ne, widget: string }
                - { label: Newari, name: newa, widget: string }

    # Variants (valid combinations)
    - label: Variants
      name: variants
      widget: list
      required: false
      fields:
        - { label: Key, name: key, widget: string, hint: "Unique ID e.g. small-polished" }
        - label: Attribute Values
          name: attributeValues
          widget: list
          fields:
            - { label: Group Name, name: group, widget: string, hint: "Must match attribute group English name" }
            - { label: Option Label, name: option, widget: string, hint: "Must match option English label" }
        - { label: Price Modifier, name: priceModifier, widget: number, default: 0 }
        - label: Variant Discount
          name: discount
          widget: object
          required: false
          fields:
            - { label: Active, name: active, widget: boolean, default: false }
            - { label: Type, name: type, widget: select, options: [percentage, flat] }
            - { label: Value, name: value, widget: number, default: 0 }
        - { label: In Stock, name: inStock, widget: boolean, default: true }
        - label: Images (override product images for this variant)
          name: images
          widget: list
          required: false
          field: { name: image, widget: image }

    # Social Embeds (unchanged)
```

---

## 2. Product Examples — New Format

### Example 1: Simple product (no variants)

```yaml
# src/content/products/copper-tumbler.md
---
slug: copper-tumbler
name:
  en: Copper Tumbler
  ne: तामाको गिलास
  newa: तामा गिलास
description:
  en: Hand-hammered copper tumbler for daily use.
  ne: दैनिक प्रयोगका लागि हातले हामेर बनाइएको तामाको गिलास।
  newa: दैनिक प्रयोग खालं तामा गिलास।
category: kitchenware
material: copper
images:
  - /images/products/tumbler.jpg
basePrice: 1200
inStock: true
featured: true
discount:
  active: false
  type: percentage
  value: 0
specifications:
  - label:
      en: Material
      ne: सामग्री
      newa: सामग्री
    value:
      en: Pure Copper
      ne: शुद्ध तामा
      newa: शुद्ध तामा
  - label:
      en: Capacity
      ne: क्षमता
      newa: क्षमता
    value:
      en: 300 ml
      ne: ३०० मिलि
      newa: ३०० मिलि
  - label:
      en: Weight
      ne: तौल
      newa: तौल
    value:
      en: 0.250 kgs
      ne: ०.२५० केजी
      newa: ०.२५० केजी
attributeGroups: []
variants: []
---
```

### Example 2: Variant-based product (nested attributes)

```yaml
# src/content/products/brass-buddha.md
---
slug: brass-buddha
name:
  en: Brass Buddha
  ne: ब्रास बुद्ध
  newa: पित्तल बुद्ध
description:
  en: Traditional brass buddha, hand-finished with care.
  ne: परम्परागत ब्रास बुद्ध, हातले बनाइएको।
  newa: परम्परागत पित्तल बुद्ध, हातले बनाइएको।
category: statue
material: brass
images:
  - /images/products/buddha.jpg
basePrice: 1800
inStock: true
featured: true
discount:
  active: false
  type: percentage
  value: 0

specifications:
  - label:
      en: Material
    value:
      en: Brass
  - label:
      en: Height
    value:
      en: 10 inches

attributeGroups:
  - name:
      en: Size
      ne: साइज
      newa: साइज
    options:
      - label:
          en: Small
          ne: सानो
          newa: सानो
      - label:
          en: Large
          ne: ठूलो
          newa: ठूलो
  - name:
      en: Finish
      ne: फिनिस
      newa: फिनिस
    options:
      - label:
          en: Polished
          ne: पॉलिस
          newa: पॉलिस
      - label:
          en: Antique
          ne: एन्टिक
          newa: एन्टिक

variants:
  - key: small-polished
    attributeValues:
      - { group: Size, option: Small }
      - { group: Finish, option: Polished }
    priceModifier: 0
    discount:
      active: true
      type: percentage
      value: 15
    inStock: true

  - key: large-polished
    attributeValues:
      - { group: Size, option: Large }
      - { group: Finish, option: Polished }
    priceModifier: 500
    discount:
      active: true
      type: percentage
      value: 10
    inStock: true

  - key: large-antique
    attributeValues:
      - { group: Size, option: Large }
      - { group: Finish, option: Antique }
    priceModifier: 650
    discount:
      active: true
      type: flat
      value: 200
    inStock: true
  # NOTE: Small+Antique does NOT exist — this IS the nesting
---
```

---

## 3. "On Sale" — Variant-Level Computation

### Problem

Currently "On Sale" only checks product-level `discount.active`. We need to surface **specific variant options** that have active discounts, with attribute names shown.

### Solution — `getSaleVariants()` in `pricing.ts`

```ts
interface SaleItem {
    product: {
        slug: string
        name: LocalizedString
        image: string
        category: string
        material: string
    }
    variantKey: string | null        // null = product-level discount
    attributeLabels: Record<string, string> | null   // { "Size": "Large", "Finish": "Antique" }
    price: number
    originalPrice: number
    hasDiscount: boolean
    discountLabel: string            // "15% off" or "NPR 200 off"
    linkParams: string               // "?Size=Large&Finish=Antique" for URL
}

function getSaleVariants(products, locale): SaleItem[] {
    const results: SaleItem[] = []

    for (const product of products) {
        const basePrice = product.data.basePrice

        // Product-level discount
        if (product.data.discount.active) {
            const discounted = applyDiscount(basePrice, product.data.discount)
            results.push({
                product: { slug, name, image, category, material },
                variantKey: null,
                attributeLabels: null,
                price: discounted,
                originalPrice: basePrice,
                hasDiscount: true,
                discountLabel: formatDiscountLabel(product.data.discount),
                linkParams: "",
            })
        }

        // Variant-level discounts
        for (const variant of product.data.variants) {
            if (variant.discount.active) {
                const totalPrice = basePrice + variant.priceModifier
                const discounted = applyDiscount(totalPrice, variant.discount)
                const labels: Record<string, string> = {}
                for (const av of variant.attributeValues) {
                    labels[av.group] = av.option
                }
                results.push({
                    product: { slug, name, image, category, material },
                    variantKey: variant.key,
                    attributeLabels: labels,
                    price: discounted,
                    originalPrice: totalPrice,
                    hasDiscount: true,
                    discountLabel: formatDiscountLabel(variant.discount),
                    linkParams: buildVariantParams(variant.attributeValues),
                })
            }
        }
    }

    // Sort: best discount first
    return results.sort((a, b) => a.price - b.price)
}
```

### Homepage rendering

Each `SaleItem` renders as a card:
- Product image
- Product name
- Subtitle with variant attributes (e.g., "Size: Large, Finish: Antique")
- Discounted price + strikethrough original + "Save X" badge
- Link → `/products/[slug]/?Size=Large&Finish=Antique` (pre-selects variant)

Computed at build time → static HTML → **0 KB JavaScript**.

---

## 4. AttributeSelector Rewrite — Variant-Aware

### Current behavior (to be replaced)

Independent attribute groups. All combinations valid. Price = basePrice + sum of selected modifiers. Option discounts computed independently.

### New behavior

1. User clicks Size "Small" → Finish options are filtered to only "Polished" (only variant with Size=Small)
2. User clicks "Large" → Finish shows both "Polished" and "Antique"
3. Disabled/hidden options get `opacity-50 cursor-not-allowed` styling with tooltip "Not available"
4. When all groups selected → matched variant found → display its price + discount
5. If no variant matches selection → show "Combination not available" message
6. URL params sync preserved
7. Cart stores variant key + matched price

### Component data flow

**Server (Astro):**
- Serialize `attributeGroups` + `variants` into a JSON script tag
- Render group buttons from `attributeGroups`

**Client (JS):**
```js
function getAvailableOptions(selectedOptions, variants) {
    // Find all variants that match currently selected attributes
    // Return available options for each group
}

function findMatchingVariant(selectedOptions, variants) {
    // Find variant where ALL attributeValues match selectedOptions
    return variants.find(v =>
        v.attributeValues.every(av =>
            selectedOptions[av.group] === av.option
        )
    )
}

function renderPrice(matchedVariant, basePrice) {
    if (!matchedVariant) return showUnavailable()
    // Display price, discount, original price
}
```

---

## 5. Homepage Redesign — Section Order

```
┌─────────────────────────────────────┐
│  1. HERO                            │
│     CSS scroll-snap carousel        │
│     or static hero with CTA         │
│     → /products/                    │
├─────────────────────────────────────┤
│  2. TRUST SIGNALS                   │
│     Grid of credibility badges      │
│     ⭐ 91% Daraz Rating             │
│     ⚡ Quick Order Processing       │
│     🔒 100% Safe Shopping           │
│     📦 7-Day Return Policy          │
│     → pure HTML + SVG icons         │
│     0 KB JavaScript                 │
├─────────────────────────────────────┤
│  3. SHOP BY CATEGORY                │
│     (functional categories)         │
│     [🍳 Kitchenware] [🪔 Puja]     │
│     [🏠 Home Decor] [🎁 Gifts]     │
│     [🗿 Statue]      [💼 Corporate] │
│     → /collections/[slug]           │
│     → only categories with products │
│     0 KB JavaScript                 │
├─────────────────────────────────────┤
│  4. HOT TOPICS                      │
│     (promoted categories)           │
│     Banner cards with images        │
│     → /collections/[slug]           │
│     0 KB JavaScript                 │
├─────────────────────────────────────┤
│  5. ON SALE                         │
│     (variant-level deals)           │
│     Product cards with:             │
│     - variant subtitle              │
│     - discounted price              │
│     - "Save X" badge                │
│     - link with pre-selected attrs  │
│     → computed at build time        │
│     0 KB JavaScript                 │
├─────────────────────────────────────┤
│  6. SHOP BY MATERIAL                │
│     [🟤 Copper] [🟡 Brass]         │
│     [🟠 Bronze]                     │
│     → /materials/[slug]             │
│     0 KB JavaScript                 │
├─────────────────────────────────────┤
│  7. FEATURED PRODUCTS               │
│     (existing, unchanged)           │
│     Product card grid               │
│     0 KB JavaScript                 │
└─────────────────────────────────────┘
```

---

## 6. New Routes

| Route | Type | Description |
|-------|------|-------------|
| `/collections/[slug]` | **NEW** | Products in a functional category with sort |
| `/materials/[slug]` | **NEW** | Products in a material type with sort |

**Category page** (`src/pages/[...locale]/collections/[slug].astro`):
- Filter products by `category === slug`
- Sort options: Newest, Price Low-High, Price High-Low
- Grid layout same as products page
- Static route generated at build time

**Material page** (`src/pages/[...locale]/materials/[slug].astro`):
- Filter products by `material === slug`
- Same layout as category page
- Static route generated at build time

**getStaticPaths for both:**

```ts
export async function getStaticPaths() {
    const categories = await getCollection("categories")
    const materials = await getCollection("materials")
    const paths = []
    for (const locale of locales) {
        for (const cat of categories) {
            paths.push({ params: { locale, slug: cat.data.slug }, props: { ... } })
        }
        for (const mat of materials) {
            paths.push({ params: { locale, slug: mat.data.slug }, props: { ... } })
        }
    }
    return paths
}
```

---

## 7. New Components

| Component | Purpose | JS Cost |
|-----------|---------|---------|
| `WhatsAppFloating.astro` | Fixed-position `wa.me` button bottom-right, visible on all pages | **0 KB** |
| `ProductSpecs.astro` | Specs table on product detail (Material, Weight, Dimensions, Capacity) | **0 KB** |
| `PaymentBadges.astro` | COD / Fonepay / Card Payment icons in footer | **0 KB** |
| `TrustBadges.astro` | Credibility badge grid on homepage | **0 KB** |
| `HeroCarousel.astro` | CSS `scroll-snap` image slider with navigation dots | **~0.5 KB** (auto-play timer only) |

### WhatsAppFloating.astro

```astro
---
const settings = await getCollection("settings")
const waNumber = settings[0]?.data.whatsappNumber || "9779861760709"
const message = encodeURIComponent("Hi Metal Hub! I have a question.")
---
<a
  href={`https://wa.me/${waNumber}?text=${message}`}
  target="_blank"
  rel="noopener noreferrer"
  class="fixed bottom-5 right-5 z-50 w-14 h-14 bg-whatsapp rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
  aria-label="Chat on WhatsApp"
>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">...</svg>
</a>
```

### ProductSpecs.astro

```astro
---
interface Props { specifications: Array<{ label: LocalizedString, value: LocalizedString }>, locale: string }
const { specifications, locale } = Astro.props
---
{specifications.length > 0 && (
  <section class="my-6">
    <h2 class="text-lg font-bold mb-3">Specifications</h2>
    <dl class="grid grid-cols-1 md:grid-cols-2 gap-2">
      {specifications.map(spec => (
        <div class="flex border-b border-border py-2">
          <dt class="font-medium text-text-2 w-1/3">{spec.label[locale] || spec.label.en}</dt>
          <dd class="text-text-1 w-2/3">{spec.value[locale] || spec.value.en}</dd>
        </div>
      ))}
    </dl>
  </section>
)}
```

### TrustBadges.astro

```astro
---
const badges = [
  { icon: "star", text: "91% Daraz Rating", subtext: "Verified by customers" },
  { icon: "zap", text: "Quick Processing", subtext: "Orders ship in 24 hrs" },
  { icon: "shield", text: "Safe & Secure", subtext: "100% secure checkout" },
  { icon: "return", text: "7-Day Returns", subtext: "Buyers protection" },
]
---
<section class="py-8 container mx-auto px-4">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    {badges.map(b => (
      <div class="text-center p-4 bg-surface-2 border border-border rounded-xl">
        <div class="text-2xl mb-2">{/* SVG icon */}</div>
        <p class="font-semibold text-sm">{b.text}</p>
        <p class="text-xs text-text-3">{b.subtext}</p>
      </div>
    ))}
  </div>
</section>
```

---

## 8. Reviews — Dynamic Plugin

Using a third-party review plugin (e.g., Judge.me, Loox, or similar).

### Integration approach

1. **Plugin selection** — choose a provider that offers an embed widget (JS snippet)
2. **Product page integration** — add plugin widget below product details in `[slug].astro`
3. **Product ID mapping** — map each product slug to the plugin's product ID (typically via a data attribute on the page)
4. **Lazy loading** — load the plugin JS via IntersectionObserver (same pattern as social embeds)

### Placeholder integration

```astro
<!-- Product detail page — below description, above footer -->
<section id="product-reviews" class="py-8 container mx-auto px-4 border-t border-border">
  <div id="review-widget" data-product-id={product.data.slug}>
    <!-- Plugin will render here -->
  </div>
</section>
```

```js
// Lazy-load review plugin when section enters viewport
const reviewObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    reviewObserver.disconnect()
    loadReviewPlugin()
  }
}, { rootMargin: "200px" })
reviewObserver.observe(document.getElementById("product-reviews"))
```

### Decision criteria for plugin selection

| Criteria | Requirement |
|----------|-------------|
| Free tier | Must have a free plan for small shops |
| Embed method | JS snippet (no iframe that blocks rendering) |
| Data portability | Can export reviews as CSV |
| Lazy-load compatible | Supports dynamic initialization |
| Custom CSS | Can match our Tailwind design |

---

## 9. Migration Path — Existing Products

### Current → New mapping

| File | Old `category` | New `category` | New `material` | Notes |
|------|---------------|----------------|----------------|-------|
| `copper-tumbler.md` | `copper` | `kitchenware` | `copper` | No variants |
| `brass-buddha.md` | `brass` | `statue` (or `puja-items`) | `brass` | Has Size + Finish variants → convert to `attributeGroups` + `variants` |
| `bronze-bowl.md` | `bronze` | `kitchenware` | `bronze` | No variants |

### Steps per product

1. Change `category` value to functional category slug
2. Add `material` field with material slug
3. Add `specifications[]` (from product details)
4. Convert `attributes[]` → `attributeGroups[]` + `variants[]`
   - For simple products (no existing attributes): leave both as empty arrays `[]`
   - For products with existing attributes: extract option labels into `attributeGroups`, generate variant combinations in `variants`

---

## 10. Full File Change List

### New files to create

| File | Contents |
|------|----------|
| `src/content/materials/copper.md` | Copper material entry |
| `src/content/materials/brass.md` | Brass material entry |
| `src/content/materials/bronze.md` | Bronze material entry |
| `src/content/categories/kitchenware.md` | Kitchenware category |
| `src/content/categories/puja-items.md` | Puja Items category |
| `src/content/categories/home-decor.md` | Home Decor category |
| `src/content/categories/gift-items.md` | Gift Items category |
| `src/content/categories/statue.md` | Statue category |
| `src/content/categories/corporate-gifts.md` | Corporate Gifts category |
| `src/components/WhatsAppFloating.astro` | Floating WhatsApp button |
| `src/components/ProductSpecs.astro` | Specifications table |
| `src/components/PaymentBadges.astro` | Payment method icons |
| `src/components/TrustBadges.astro` | Credibility badge grid |
| `src/components/HeroCarousel.astro` | CSS scroll-snap carousel (optional) |
| `src/pages/[...locale]/collections/[slug].astro` | Category product listing page |
| `src/pages/[...locale]/materials/[slug].astro` | Material product listing page |

### Files to modify

| File | Changes |
|------|---------|
| `src/content.config.ts` | Add `materials` collection, update `categories` schema, update `products` schema |
| `public/admin/config.yml` | Add materials collection, update categories fields, update products fields |
| `src/lib/pricing.ts` | Add `getSaleVariants()`, variant matching helpers |
| `src/components/AttributeSelector.astro` | **Rewrite for variant-aware selection** |
| `src/components/ProductCard.astro` | Add material badge, update category label source |
| `src/components/Footer.astro` | Add payment badges |
| `src/layouts/BaseLayout.astro` | Add WhatsApp floating button |
| `src/pages/[...locale]/index.astro` | **Full rewrite** with all new sections |
| `src/pages/[...locale]/products/index.astro` | Add material filter, fix category labels |
| `src/pages/[...locale]/products/[slug].astro` | Add specs section, review plugin placeholder, variant selector |
| `src/styles/global.css` | Carousel, specs table, variant styles |
| `src/content/products/copper-tumbler.md` | Update to new schema |
| `src/content/products/brass-buddha.md` | Update to new schema with variants |
| `src/content/products/bronze-bowl.md` | Update to new schema |
| `src/content/categories/copper.md` | **Remove** — replaced by material + functional category |
| `src/content/categories/brass.md` | **Remove** — same |
| `src/content/categories/bronze.md` | **Remove** — same |

### Files to remove

| File | Reason |
|------|--------|
| `src/content/categories/copper.md` | Replaced by `materials/copper.md` |
| `src/content/categories/brass.md` | Replaced by `materials/brass.md` |
| `src/content/categories/bronze.md` | Replaced by `materials/bronze.md` |

### Translation keys affected

| Current Key | Status | Replacement |
|-------------|--------|-------------|
| `products.copper` | Remove | Use `materials` collection data |
| `products.brass` | Remove | Use `materials` collection data |
| `products.bronze` | Remove | Use `materials` collection data |

---

## 11. Implementation Order

Organized into independent phases. Each phase is deployable on its own.

### Phase 1 — Data Foundation

Files: `content.config.ts`, `admin/config.yml`, new content files

1. Add `materials` collection to content config + CMS
2. Update `categories` schema (add image, description, promoted)
3. Update `products` schema (add material, specifications, attributeGroups, variants)
4. Create material content files (copper, brass, bronze)
5. Create functional category content files (kitchenware, puja-items, home-decor, gift-items, statue, corporate-gifts)
6. Remove old category files (copper.md, brass.md, bronze.md)
7. Update existing product files to new schema
8. Remove old translation keys for `products.copper`, `products.brass`, `products.bronze`

**Testing:** `bun run build` passes, CMS admin shows new collections

### Phase 2 — Core Components

Files: new components, updated existing components

1. Create `ProductSpecs.astro`
2. Create `WhatsAppFloating.astro`
3. Create `PaymentBadges.astro`
4. Create `TrustBadges.astro`
5. Update `ProductCard.astro` — add material badge, update category label
6. Update `Footer.astro` — add payment badges
7. Update `BaseLayout.astro` — add WhatsApp floating button
8. Add `HeroCarousel.astro` (CSS-only, optional)
9. Update `global.css` — new component styles

**Testing:** Components render correctly across all pages

### Phase 3 — Variant AttributeSelector

Files: `AttributeSelector.astro` rewrite, `pricing.ts` additions

1. Update `pricing.ts` — add `getSaleVariants()`, variant matching
2. Rewrite `AttributeSelector.astro` — variant-aware selection, option filtering, unavailable state
3. Update `[slug].astro` — pass new data structure to AttributeSelector

**Testing:** Product detail page with variant products works correctly:
- Selecting "Small" filters finish options
- Selecting "Large" shows more finish options
- Variant pricing and discounts show correctly
- URL params sync works
- Add to cart stores variant key

### Phase 4 — Homepage Redesign

Files: `index.astro` rewrite

1. Hero section (static or carousel)
2. Trust signals section
3. Shop by Category section (functional categories)
4. Hot Topics section (promoted categories)
5. On Sale section (variant-level deals, computed at build)
6. Shop by Material section
7. Featured products section (keep existing)

**Testing:** Homepage renders all sections, links work, sale items show variant details

### Phase 5 — New Routes + Products Page

Files: `collections/[slug].astro`, `materials/[slug].astro`, `products/index.astro`

1. Create category page — `/collections/[slug]`
2. Create material page — `/materials/[slug]`
3. Update products page — add material filter, fix category labels
4. Update sitemap config for new routes

**Testing:** All new routes 200 OK, filtering works, sort options work

### Phase 6 — Reviews Integration

Files: `[slug].astro` — add review plugin placeholder

1. Choose a review plugin provider
2. Add embed code to product detail page
3. Implement lazy loading via IntersectionObserver
4. Test with 2-3 products

**Testing:** Reviews load lazily below product fold, don't block initial page render

---

## 12. Performance Budget

Every new feature is designed to add near-zero runtime cost.

| Feature | KB (HTML) | KB (JS) | KB (CSS) | KB (Images) |
|---------|-----------|---------|----------|-------------|
| Current site (baseline) | ~15 KB | ~8 KB | ~5 KB | ~200 KB (lazy) |
| + Materials collection | +0.1 KB | 0 | 0 | 0 |
| + Specifications table | +0.5 KB | 0 | 0 | 0 |
| + On Sale section | +2 KB | 0 | 0 | 0 |
| + WhatsApp floating button | +0.1 KB | 0 | +0.1 KB | 0 |
| + Trust badges | +1 KB | 0 | 0 | 0 |
| + Payment badges | +0.3 KB | 0 | 0 | 0 |
| + Hot Topics | +1 KB | 0 | 0 | 0 |
| + Hero carousel (CSS) | +1 KB | +0.5 KB | +1 KB | +200 KB (lazy) |
| + Category/Material pages | +2 KB/page | 0 | 0 | varies |
| + AttributeSelector rewrite | 0 | ~same | 0 | 0 |
| + Reviews plugin | +0.5 KB | +15 KB (lazy) | 0 | 0 |
| **Total added** | **~8.5 KB** | **~0.5 KB** (core) | **~1 KB** | **~200 KB (lazy)** |

JS breakdown:
- Core site (existing): ~8 KB (cart, gallery, social embeds, language switcher)
- New features: ~0.5 KB (carousel auto-play timer only)
- Reviews plugin: ~15 KB (loaded lazily, never blocks)

**All new JS outside the review plugin: ~0.5 KB.**

---

## Appendix: Key Design Decisions

### Why variants instead of flat attributes?

The flat model assumed all attribute combinations are valid (e.g., Small+Polished, Small+Antique, Large+Polished, Large+Antique). The variant model explicitly defines valid combinations, enabling:
- Nested/dynamic dependencies (Size=Small → only Finish=Polished)
- Per-combination pricing, discounts, stock, and images
- Clear on-sale logic at the variant level

### Why keep product-level discount as fallback?

For simple products with no variants, the product-level `discount` field provides a quick way to set a sale without creating variants. The pricing logic checks variants first, falls back to product discount.

### Why System Font Stack?

The ui-ux-pro-max design system recommended Rubik + Nunito Sans, but loading Google Fonts adds network requests (~50-100 KB) and blocks rendering. Tailwind's `font-sans` (system stack) loads instantly at 0 bytes. We achieve the "Exaggerated Minimalism" look via `font-extrabold`/`font-black`, `clamp()` sizing, and generous letter-spacing instead.

### Why CSS scroll-snap for carousel instead of JS?

- Zero JS for basic scroll interaction
- Native smooth scrolling on all browsers
- Accessible (keyboard navigable)
- Only a tiny JS timer needed for optional auto-play
- No library dependency
