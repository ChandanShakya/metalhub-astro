# Contributing to Metal Hub

Development guide for future contributors.

## Development Workflow

```sh
# 1. Install dependencies
npm install

# 2. Start dev server (hot reload at http://localhost:4321)
npm run dev

# 3. Make your changes

# 4. Verify the build succeeds
npm run build

# 5. Preview the production build
npm run preview

# 6. Commit and push (triggers Cloudflare Pages rebuild)
git add <files>
git commit -m "Description of change"
git push
```

## Project Conventions

### Components

- All components are **`.astro` files** in `src/components/`
- No React, Vue, Svelte, or other frameworks — pure Astro components
- Interactive behavior uses `<script>` tags in the component (vanilla JS)
- Components receive data via props; no global state beyond `localStorage`

### Pages

- Each page exists in **3 locale variants** (EN, NE, Newa)
- English pages are at the root (e.g., `src/pages/products/index.astro`)
- Nepali pages are at `/ne/` (e.g., `src/pages/ne/products/index.astro`)
- Newari pages are at `/newa/` (e.g., `src/pages/newa/products/index.astro`)
- When adding a new page, create all 3 locale versions

### Adding a New Page

1. Create the English version at `src/pages/<page-name>.astro`
2. Create `src/pages/ne/<page-name>.astro` (Nepali)
3. Create `src/pages/newa/<page-name>.astro` (Newari)
4. Use the `BaseLayout` component with the appropriate `locale` prop
5. Import and use `getTranslations(locale)` for all UI text
6. Add navigation links in `src/components/Header.astro` for all 3 locales

### Adding a New Component

1. Create `src/components/ComponentName.astro`
2. Use props for data input (define `interface Props` at the top)
3. For client-side interactivity, add a `<script>` tag at the bottom
4. Follow existing naming: PascalCase for component files

### Content Collections

Content schemas are defined in `src/content.config.ts`. Four collections exist:

| Collection | Directory | Purpose |
|------------|-----------|---------|
| `categories` | `src/content/categories/` | Product categories |
| `products` | `src/content/products/` | Product catalog |
| `socialHighlights` | `src/content/social-highlights/` | Instagram/TikTok embeds |
| `settings` | `src/content/settings/` | Site config (WhatsApp, Messenger) |

To add a new collection:

1. Define the schema in `src/content.config.ts` using `defineCollection` + Zod
2. Create the content directory under `src/content/`
3. Add a CMS collection entry in `public/admin/config.yml`
4. Access the collection in pages via `getCollection('collectionName')`

### Adding a New Product Manually

Create a markdown file in `src/content/products/<slug>.md`:

```markdown
---
slug: my-product
name:
  en: "Product Name"
  ne: "नेपाली नाम"
  newa: "नेवाः नाम"
description:
  en: "Description in English."
  ne: "नेपाली विवरण।"
  newa: "नेवाः विवरण।"
images:
  - /images/products/my-product.jpg
category: brass
basePrice: 1500
inStock: true
featured: false
discount:
  active: false
  type: percentage
  value: 0
attributes:
  - name: Size
    options:
      - label: Small
        priceModifier: 0
      - label: Large
        priceModifier: 500
---
```

## i18n

### UI Translations

All static UI text (buttons, labels, headings) is in JSON dictionaries:

- `src/i18n/en.json` — English
- `src/i18n/ne.json` — Nepali
- `src/i18n/newa.json` — Newari (written in Devanagari, displayed in Ranjana script)

### Adding a New Translation Key

1. Add the key to all 3 JSON files:
   ```json
   "my.newKey": "English text"
   ```
2. Use it in components via the translation function:
   ```astro
   ---
   import { getTranslations } from '../lib/i18n';
   const { locale } = Astro.props;
   const t = getTranslations(locale);
   ---
   <p>{t('my.newKey')}</p>
   ```

### Important: Newari ≠ Nepali

Newari (Nepal Bhasa) and Nepali are different languages. The `newa` field must contain genuine Nepal Bhasa wording, not a copy of the Nepali text. The client or a translator should write the Newari content separately.

### Ranjana Script

Newari content is stored as Devanagari text. The site applies a Ranjana-mapped font via CSS:

```css
[data-locale="newa"] {
  font-family: "Ranjana Lipi", "Noto Sans Devanagari", var(--font-body);
}
```

No special input method is needed — the client types normal Devanagari in the CMS, and the font handles the visual transformation.

## Styling

All styles are in `src/styles/global.css` (single file, ~670 lines).

### Design Tokens

Custom properties at `:root`:

```css
--color-primary: #9a5f2a;      /* Bronze */
--color-secondary: #c9a84c;    /* Gold */
--color-sale: #dc2626;         /* Red */
--color-success: #16a34a;      /* Green */
--color-whatsapp: #25d366;     /* WhatsApp brand */
--color-messenger: #0084ff;    /* Messenger brand */
```

### Adding Styles

- Add new component styles to `global.css` following the existing naming convention
- Use CSS custom properties for colors and spacing
- Responsive breakpoints: `768px` (tablet) and `480px` (mobile)
- The layout uses `.container` (max-width 1200px) and CSS Grid/Flexbox

### View Transitions

Astro's `<ClientRouter />` enables SPA-like page transitions. Custom fade animations are defined in `global.css`. If you add new page transitions, ensure the header stays stable during navigation.

## Discount Logic

The discount precedence logic is in `src/lib/pricing.ts`:

1. Check all selected attribute options for active discounts
2. If any option has a discount, apply the **single largest** one (never stack)
3. If no option discount exists, fall back to the **product-level** discount
4. If neither exists, no discount

When modifying pricing or discount logic, update `calculatePrice()` in `pricing.ts`.

## Cart

The cart uses `localStorage` with key `metalhub-cart`. See `src/lib/cart.ts` for:

- `getCart()` / `saveCart()` — read/write
- `addToCart()` — adds item or increments quantity for duplicates (matched by slug + selected options)
- `removeFromCart()` / `updateQuantity()` — modify items
- `getCartTotal()` — sum of all items

## Testing Locally

There is no test framework configured. Verify changes by:

1. `npm run build` — ensure no build errors
2. `npm run dev` — check all pages render correctly
3. Test all 3 locales (EN, NE, Newa)
4. Test the full flow: browse → add to cart → checkout → WhatsApp/Messenger link
5. Test CMS at `http://localhost:4321/admin` (requires the auth Worker running locally or in production)
