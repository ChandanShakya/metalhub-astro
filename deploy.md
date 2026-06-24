# Deployment Guide

Step-by-step guide to deploy Metal Hub to Cloudflare Pages with Sveltia CMS.

---

## 1. Push to GitHub

```sh
# Create a new repo on GitHub (e.g., metalhub-astro), then:
git remote add origin git@github.com:<your-username>/metalhub-astro.git
git branch -M main
git push -u origin main
```

## 2. Connect to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select your GitHub repo (`metalhub-astro`)
4. Configure the build:
   - **Build command:** `bun run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `22` (set in **Environment variables**: `NODE_VERSION` = `22`)
5. Click **Save and Deploy**

Cloudflare will build and deploy your site. The first deploy takes ~1-2 minutes. Subsequent pushes to `main` trigger automatic rebuilds.

Note your deployment URL (e.g., `https://metalhub-astro.pages.dev`).

## 3. Deploy the Sveltia CMS Auth Worker

Sveltia CMS needs an OAuth proxy to authenticate with GitHub. Deploy it as a Cloudflare Worker.

### Option A: One-click deploy

1. Go to [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
2. Click the **Deploy to Cloudflare Workers** button
3. Follow the prompts to authorize and deploy

### Option B: Manual deploy

```sh
# Clone the auth worker
git clone https://github.com/sveltia/sveltia-cms-auth.git
cd sveltia-cms-auth

# Install dependencies
bun install

# Deploy to Cloudflare Workers
bunx wrangler deploy
```

Note the Worker URL (e.g., `https://sveltia-cms-auth.<your-subdomain>.workers.dev`).

## 4. Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `Metal Hub CMS`
   - **Homepage URL:** `https://metalhub-astro.pages.dev`
   - **Authorization callback URL:** `https://sveltia-cms-auth.<your-subdomain>.workers.dev/api/auth`
4. Click **Register application**
5. Note the **Client ID**
6. Click **Generate a new client secret** and note it immediately (it won't be shown again)

### Set the secrets on the Worker

```sh
cd sveltia-cms-auth

# Set the OAuth credentials as Worker secrets
bunx wrangler secret put GITHUB_CLIENT_ID
# Paste your Client ID when prompted

bunx wrangler secret put GITHUB_CLIENT_SECRET
# Paste your Client Secret when prompted
```

## 5. Configure the CMS

Edit `public/admin/config.yml` and replace the placeholder values:

```yaml
backend:
  name: github
  repo: <your-username>/metalhub-astro   # e.g., chandan/metalhub-astro
  branch: main
  base_url: https://sveltia-cms-auth.<your-subdomain>.workers.dev
```

Commit and push:

```sh
git add public/admin/config.yml
git commit -m "Configure CMS backend"
git push
```

Cloudflare Pages will automatically rebuild.

## 6. Configure Site Settings

Edit `src/content/settings/site.json` with your business details:

```json
{
  "whatsappNumber": "9779861760709",
  "messengerPage": "metalhub.np"
}
```

- **whatsappNumber:** Full phone number with country code (no `+` or spaces)
- **messengerPage:** Facebook Page username (the part after `m.me/`)

Commit and push.

## 7. Set Up Content Directories

Create the content directories that the CMS expects:

```sh
mkdir -p src/content/products
mkdir -p src/content/categories
```

Add a `.gitkeep` to each so they're tracked by git:

```sh
touch src/content/products/.gitkeep
touch src/content/categories/.gitkeep
git add src/content/products/.gitkeep src/content/categories/.gitkeep
git commit -m "Add content directories for CMS"
git push
```

### Sample product file

Create `src/content/products/brass-chiba.md`:

```markdown
---
slug: brass-chiba
name:
  en: "Brass Chiba"
  ne: "ब्रास चिया"
  newa: "पित्तल चिया"
description:
  en: "Traditional brass chiba, hand-finished with care."
  ne: "परम्परागत ब्रास चिया, हातले बनाइएको।"
  newa: "परम्परागत पित्तल चिया, हातले बनाइएको।"
images:
  - /images/products/chiba-1.jpg
category: brass
basePrice: 1800
inStock: true
featured: true
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
          value: 15
        images:
          - /images/products/chiba-small.jpg
      - label:
          en: Medium
          ne: मध्यम
          newa: मध्यम
        priceModifier: 300
        discount:
          active: true
          type: percentage
          value: 10
      - label:
          en: Large
          ne: ठूलो
          newa: ठूलो
        priceModifier: 700
        discount:
          active: true
          type: flat
          value: 200
socialEmbeds:
  - platform: tiktok
    embedCode: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@metalhub.np" data-unique-id="metalhub.np" data-embed-from="embed_page" data-embed-type="creator" style="max-width:780px;min-width:288px;"><section><a target="_blank" href="https://www.tiktok.com/@metalhub.np?refer=creator_embed">@metalhub.np</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>'
---
```

### Sample category file

Create `src/content/categories/brass.md`:

```markdown
---
slug: brass
name:
  en: "Brass"
  ne: "ब्रास"
  newa: "पित्तल"
icon: "\U0001FA99"
order: 2
---
```

## 8. Add Product Images

Place product images in `public/images/products/`:

```sh
mkdir -p public/images/products
# Copy your product images here
```

Images referenced in product files (e.g., `/images/products/chiba-1.jpg`) must be placed in this directory. The CMS can also upload images directly when editing products.

## 9. Set Up the Ranjana Font

Newari text is displayed in Ranjana script via a Devanagari-mapped font.

### Source the font

Look for "Ranjana Lipi" web fonts. Common sources:
- [Nepal Lipi Guthi](https://nepallipiguthi.org) community fonts
- Open-source Ranjana font projects on GitHub

### Verify the license

Before using the font on a commercial site, confirm the license permits embedding and redistribution. Most community Ranjana fonts are shared for cultural/personal use — contact the credited author if the license is unclear.

### Add the font files

```sh
mkdir -p public/fonts
# Place your .woff2 files here, e.g.:
# public/fonts/ranjana-lipi.woff2
```

### Add @font-face declaration

Add this to `src/styles/global.css`:

```css
@font-face {
  font-family: "Ranjana Lipi";
  src: url("/fonts/ranjana-lipi.woff2") format("woff2");
  font-display: swap;
}
```

The CSS already applies this font to the Newari locale:

```css
[data-locale="newa"] {
  font-family: "Ranjana Lipi", "Noto Sans Devanagari", var(--font-sans);
}
```

If the font fails to load, text falls back to Noto Sans Devanagari — readable, never broken.

## 10. Post-Deploy Verification

After deployment, verify everything works:

### Pages to check

- [ ] `/` — Home page loads, hero displays, featured products render
- [ ] `/products/` — Product grid shows all products, "Load More" pagination works
- [ ] `/products/:slug` — Product detail with gallery, lightbox, share button, attribute selectors
- [ ] `/checkout/` — Cart (with product images and links), form, map with search, order buttons
- [ ] `/social` — Facebook plugin, TikTok profile, Instagram profile embeds load
- [ ] `/ne/...` — All Nepali pages render with correct translations
- [ ] `/newa/...` — All Newari pages render in Ranjana script

### Functional checks

- [ ] Language switcher changes locale via SPA (no page refresh)
- [ ] Active nav link highlights current page
- [ ] Attribute selection updates price and URL params (`?Size=Large`)
- [ ] Product page gallery: thumbnails, arrows, lightbox, attribute image swap
- [ ] Share button opens popup with social share options
- [ ] Cart shows product images and clickable product names with attribute params
- [ ] Map with search loads and allows placing a pin by searching landmarks
- [ ] "Order via WhatsApp" opens WhatsApp with a pre-filled message including product links
- [ ] Order buttons disabled until name + phone + delivery location are filled

### CMS check

- [ ] Navigate to `/admin`
- [ ] Log in with GitHub OAuth
- [ ] Create a test product with translatable attributes and social embeds
- [ ] Verify the rebuild triggers and the product appears on the site

## 11. Custom Domain (Optional)

To use a custom domain (e.g., `metalhub.com.np`):

1. In Cloudflare Pages, go to your project → **Custom domains**
2. Add your domain
3. If the domain is already on Cloudflare, DNS records are added automatically
4. If not on Cloudflare, update your domain's nameservers to point to Cloudflare
5. SSL certificate is provisioned automatically

## Troubleshooting

### Build fails with "Cannot find module"

Run `bun install` locally and commit `bun.lock`. Ensure `NODE_VERSION` is set to `22` in Cloudflare Pages environment variables.

### CMS login shows "Repository not found"

Verify the `repo` field in `public/admin/config.yml` matches `<your-username>/<repo-name>` exactly. The GitHub OAuth App must be owned by the same user/org that owns the repo.

### Map doesn't load

Check the browser console for errors. Leaflet loads from unpkg CDN — ensure there are no content security policy blocks. The map is lazy-loaded and only initializes when scrolled into view.

### Social embeds not loading on SPA navigation

Social embeds (TikTok, Instagram, Facebook) re-initialize on `astro:page-load` events. If they don't appear, check the browser console for script loading errors.

### Ranjana font not rendering

Verify the font files exist at `public/fonts/`, the `@font-face` declaration is in `global.css`, and the font family name matches exactly. Check the Network tab to confirm the font file loads.
