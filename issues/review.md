---
title: "Product Reviews System — Cloudflare D1 + Turnstile"
labels: enhancement
assignees: ""
---

## Summary

Add a product review system with star ratings, a review submission form, and spam protection — all on Cloudflare's free tier using **D1 database** and **Turnstile**.

## Architecture

```
┌──────────────────────┐       ┌──────────────────────┐
│  Astro (Cloudflare   │ ──►   │  /api/reviews.ts     │
│  Pages / SSG)        │ ◄──   │  (serverless fn)     │
│                      │       │                      │
│  ReviewForm.astro    │       │  Turnstile verify    │
│  ReviewList.astro    │       │  D1 query/insert     │
│  ReviewSummary.astro │       └──────┬───────────────┘
└──────────────────────┘              │
                                      ▼
                              ┌────────────────┐
                              │  Cloudflare D1 │
                              │  (reviews table)│
                              └────────────────┘
```

## Tasks

### [ ] 1. Create D1 Database

- Run `wrangler d1 create metalhub-reviews`
- Add binding to `wrangler.jsonc`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "metalhub-reviews"
database_id = "<generated-id>"
```

### [ ] 2. Define Schema & Migrate

Create `src/db/schema.sql`:

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reviews_product ON reviews(product_slug, is_approved);
```

Apply with `wrangler d1 migrations`.

### [ ] 3. Set Up Turnstile

- Create Turnstile site key + secret key via Cloudflare Dashboard
- Add secrets to project (or `wrangler secret put TURNSTILE_SECRET_KEY`)

### [ ] 4. Create API Route (`src/pages/api/reviews.ts`)

- `export const prerender = false`
- **GET** `/api/reviews?product=slug&locale=en` → query D1 for approved reviews, return JSON
- **POST** `/api/reviews` → validate Turnstile token, validate fields, insert into D1
- CORS headers if needed

### [ ] 5. Create Frontend Components

| Component | Purpose |
|-----------|---------|
| `src/components/ReviewList.astro` | Fetch & render reviews with star rating, author, date. Pagination / load more |
| `src/components/ReviewForm.astro` | Star rating UI (clickable ☆→★), name/email/text fields, Turnstile widget, form validation, POST to API |
| `src/components/ReviewSummary.astro` | Average rating, star breakdown bar, total count |

All use existing project patterns: vanilla JS `<script>` blocks, `AbortController` cleanup, Tailwind CSS.

### [ ] 6. Wire Into Product Page

Replace the empty `#review-widget` div in `src/pages/[...locale]/products/[slug].astro`:

```astro
<ReviewSummary {slug} />
<ReviewList {slug} />
<ReviewForm {slug} />
```

### [ ] 7. Add i18n Translation Keys

Add to `src/content/i18n/` for: `review_title`, `review_write`, `review_submit`, `review_success`, `review_rating`, `review_name`, `review_email`, `review_text`, `review_empty`, `review_average`, `review_error`.

## Key Design Decisions

| Concern | Solution |
|---------|----------|
| **Cost** | D1 free tier (5M rows/mo) + Turnstile free = $0 |
| **Spam protection** | Turnstile CAPTCHA-less verification |
| **Moderation** | `is_approved` column, default 0 (hidden). Manual approval via admin UI later |
| **Trilingual** | `locale` column per review, filtered on fetch |
| **SPA navigation** | Follow existing `AbortController` pattern |
| **Rate limiting** | 1 review per product per email per day |

## Future Enhancements (Phase 2)

- Moderation dashboard (approve/reject in Sveltia CMS)
- Review image uploads
- Reply from seller
- Verified purchase badge
- Sort/filter reviews
