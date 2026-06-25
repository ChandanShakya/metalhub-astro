# Contributing to Metal Hub

Development guide for future contributors.

## Development Workflow

```sh
# 1. Install dependencies
bun install

# 2. Start dev server (hot reload at http://localhost:4321)
bun run dev

# 3. Make your changes

# 4. Lint and format your code
bun run lint:fix

# 5. Verify the build succeeds
bun run build

# 6. Type check
bun run astro check

# 7. Preview the production build
bun run preview

# 8. Commit and push (triggers Cloudflare Pages rebuild)
git add <files>
git commit -m "Description of change"
git push
```

Formatting and linting run automatically on commit via pre-commit hooks (husky + lint-staged). If a commit is rejected, run `bun run lint:fix` and try again.

## Project Conventions

### Components

- All components are **`.astro` files** in `src/components/`
- No React, Vue, Svelte, or other frameworks — pure Astro components
- Interactive behavior uses `<script is:inline>` tags with `AbortController` for SPA safety
- Components receive data via props; no global state beyond `localStorage`
- **Tailwind CSS** for all styling — no manual CSS files, no `@apply` component classes

### Pages

- Pages use **`[...locale]` dynamic routes** with `getStaticPaths()` for all 3 locales
- Each page generates 3 static paths: `/` (EN), `/ne/...` (Nepali), `/newa/...` (Newari)
- The `locale` prop is read from `Astro.params` and passed to components

### Adding a New Page

1. Create at `src/pages/[...locale]/<page-name>.astro`
2. Add `getStaticPaths()` generating paths for each locale
3. Read `locale` from `Astro.props`
4. Import and use `getTranslations(locale)` for all UI text
5. Add navigation links in `src/components/Header.astro`

### Adding a New Component

1. Create `src/components/ComponentName.astro`
2. Use props for data input (define `interface Props` at the top)
3. For client-side interactivity, add `<script is:inline>` with `AbortController`
4. Follow existing naming: PascalCase for component files
5. Use Tailwind utility classes only — no custom CSS classes

### Content Collections

Content schemas are defined in `src/content.config.ts`. Four collections exist:

| Collection | Directory | Purpose |
|------------|-----------|---------|
| `categories` | `src/content/categories/` | Product categories |
| `products` | `src/content/products/` | Product catalog with translatable attributes |
| `settings` | `src/content/settings/` | Site config (WhatsApp, Messenger) |
| `i18n` | `src/content/i18n/` | CMS-managed translation overrides |

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
  - name:
      en: Size
      ne: साइज
      newa: साइज
    options:
      - label:
          en: Small
          ne: सानो
          newa: सानो
        priceModifier: 0
        discount:
          active: true
          type: percentage
          value: 10
        images:
          - /images/products/my-product-small.jpg
      - label:
          en: Large
          ne: ठूलो
          newa: ठूलो
        priceModifier: 500
socialEmbeds:
  - platform: tiktok
    embedCode: '<blockquote class="tiktok-embed" ...>...</blockquote>'
---
```

### Attribute Keys (Important)

Attribute names and option labels are stored as `{en, ne, newa}` objects for translation. However, **URL params and cart storage always use English keys** via `data-key` attributes. This ensures shareable links and cross-locale cart consistency.

- URL params: `?Size=Large&Finish=Antique` (always English)
- Cart `selectedOptions`: `{ "Size": "Large" }` (always English)
- Order message: includes product links with English-key params

## i18n

### UI Translations

All static UI text (buttons, labels, headings) is in CMS-managed markdown files:

- `src/content/i18n/*.md` — Each file contains a single translation key with values for all 3 locales

### Adding a New Translation Key

1. Create a new `.md` file in `src/content/i18n/` with the key and locale values:
   ```yaml
   ---
   key: my.newKey
   en: "English text"
   ne: "नेपाली पाठ"
   newa: "नेवारी पाठ"
   ---
   ```
2. Use it in components via the translation function:
   ```astro
   ---
   import { getTranslations } from "../lib/i18n";
   const { locale } = Astro.props;
   const t = await getTranslations(locale);
   ---
   <p>{t("my.newKey")}</p>
   ```

### Important: Newari ≠ Nepali

Newari (Nepal Bhasa) and Nepali are different languages. The `newa` field must contain genuine Nepal Bhasa wording, not a copy of the Nepali text.

### Ranjana Script

Newari content is stored as Devanagari text. The site applies a Ranjana-mapped font via CSS:

```css
[data-locale="newa"] {
    font-family: "Ranjana Lipi", "Noto Sans Devanagari", var(--font-sans);
}
```

## Styling

All styles use **Tailwind CSS v4** utility classes — no manual CSS files.

### Configuration

Tailwind is configured via CSS-first approach in `src/styles/global.css`:

```css
@import "tailwindcss";
@theme { /* custom colors, spacing */ }
```

The Vite plugin (`@tailwindcss/vite`) handles everything — no `tailwind.config.js` needed.

### Custom Theme Tokens

Defined in the `@theme` block in `global.css`:

```css
@theme {
    --color-accent: #b45309;
    --color-surface-2: #ffffff;
    --color-text-1: #0f172a;
    /* ... */
}
```

Use in templates as: `bg-accent`, `text-text-1`, `border-border`, etc.

### Residual CSS

Only raw CSS that can't be Tailwind utilities:
- View transition animations (`::view-transition-*`)
- Leaflet map overrides (external lib)
- `[data-locale="newa"]` font family

## SPA Patterns

### AbortController for Event Listeners

All `<script is:inline>` scripts use `AbortController` to prevent event listener accumulation during SPA navigation:

```js
var _abort = null;
function init() {
    if (_abort) _abort.abort();
    _abort = new AbortController();
    var signal = _abort.signal;
    document.getElementById("btn").addEventListener("click", handler, { signal });
}
document.addEventListener("astro:page-load", init);
```

### Cart Sync

Cart changes dispatch a custom event for same-tab reactivity:

```js
function saveCart(items) {
    localStorage.setItem("metalhub-cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
}
```

## Discount Logic

The discount precedence logic is in `src/lib/pricing.ts`:

1. Check all selected attribute options for active discounts
2. If any option has a discount, apply the **single largest** one (never stack)
3. If no option discount exists, fall back to the **product-level** discount
4. If neither exists, no discount

## Cart

Cart uses `localStorage` with key `metalhub-cart`. Cart logic is implemented inline in each component's `<script is:inline>` block (no shared library — `src/lib/cart.ts` was removed).

Cart items store: `slug`, `name`, `images[]`, `selectedOptions` (English keys), `selectedModifiers`, `unitPrice`, `originalUnitPrice`, `hasDiscount`, `qty`.

## Testing Locally

There is no test framework configured. Verify changes by:

1. `bun run lint` — check for lint/format issues
2. `bun run build` — ensure no build errors
3. `bun run astro check` — ensure no TypeScript errors
4. `bun run dev` — check all pages render correctly
5. Test all 3 locales (EN, NE, Newa)
6. Test the full flow: browse → select attributes → add to cart → checkout → WhatsApp/Messenger link
7. Test share popup, product gallery, map search, social embeds
8. Test CMS at `http://localhost:4321/admin` (requires the auth Worker running locally or in production)

## Linting & Formatting

The project uses [Biome](https://biomejs.dev) for linting and formatting:

| Command | Action |
|---------|--------|
| `bun run lint` | Check for lint/format issues |
| `bun run lint:fix` | Auto-fix lint and format issues |
| `bun run format` | Format all files (4-space indent, double quotes, semicolons) |

### Configuration

- **biome.json** — formatter (4-space indent, 120 line width), linter (recommended rules), import sorting, Tailwind directive support
- **.husky/pre-commit** — runs lint-staged on commit
- **lint-staged** — applies `biome check --write` to staged `.astro`, `.ts`, `.js`, `.json`, `.css` files

### Style conventions

- 4-space indentation (enforced by Biome)
- Double quotes in JS/TS and HTML attributes
- Semicolons always
- Import sorting handled automatically by Biome
- `transition-[colors,transform]` instead of `transition-all` (Lighthouse performance)
- `data-selected` attribute for state tracking (not CSS class matching)
