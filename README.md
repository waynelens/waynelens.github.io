# Minimalist Photography Blog

A narrative-driven photography blog and digital gallery. The site presents photo stories in a responsive card feed, with dedicated article pages and full, non-cropped image collections.

## Features

- Responsive photography post feed
- Markdown-based articles with typed frontmatter
- Draft, published, and direct-link-only article statuses
- Image previews and a lightweight custom carousel
- Daily dense-grid gallery with bounded circular rendering
- Accessible native-dialog image lightbox
- Clustered dive-site map and detailed scuba logs
- Interactive depth, water-temperature, and tank-pressure profiles
- Local FIT and UDDF dive-computer import workflow
- Dark and light themes
- Static generation and automatic GitHub Pages deployment
- Originals hosted on Cloudflare R2 with Cloudflare Images transformations for thumbnails

## Tech Stack

| Area | Implementation |
| :--- | :--- |
| Framework | Nuxt 4 and Vue 3 |
| Content | Nuxt Content 3 with Markdown |
| Validation | Zod |
| Gallery | Vue components and CSS Grid |
| Image viewer | Vue-controlled native dialog |
| Dive charts | Apache ECharts |
| Dive import | Garmin FIT SDK and fast-xml-parser |
| Storage | Cloudflare R2 and Cloudflare Images transformations |
| Hosting | GitHub Pages |

## Project Structure

```text
.
├── assets/css/             # Global styles
├── components/
│   ├── gallery/           # Carousel, gallery, and lightbox
│   ├── dives/             # Dive map, log dialog, and profile chart
│   └── layout/            # Header and post previews
├── content/blog/           # Markdown photography stories
├── content/dives/          # Dive log summaries
├── content/dive-profiles/  # Normalized time-series profiles
├── content/dive-sites/     # Dive-site coordinates and descriptions
├── scripts/import-dive.mjs # FIT/UDDF importer
├── layouts/default.vue     # Shared page layout
├── pages/
│   ├── index.vue          # Homepage feed
│   └── blog/[...slug].vue # Article page
├── content.config.ts       # Blog collection schema
└── nuxt.config.ts          # Nuxt configuration
```

## Local Development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run generate
```

Import a dive-computer log with:

```bash
npm run import:dive -- "/path/to/dive.fit" --site-id longdong --dive-number 12
```

The importer also accepts `.uddf` and `.xml` files. It writes a draft dive YAML
and a normalized profile JSON while excluding GPS coordinates, device serials,
owner data, and unrelated watch metadata. Review the bilingual copy, site,
breathing gas, and entry type before publishing. Use `--dry-run` to inspect the
normalized result without writing files.

## Publishing Workflow

1. Upload exported images to Cloudflare R2. Use content-hashed object names (for example, `longdong-dive.a1b2c3.jpg`) so an updated file receives a new URL instead of reusing a cached object name.
2. Add a Markdown file under `content/blog/` and define its metadata and image URLs in frontmatter.
3. Leave `status` unset (or set it to `draft`) while writing. Use `published` for normal publication or `hidden` for a direct-link-only article.
4. Push to `main`; GitHub Actions generates the static site and deploys it to GitHub Pages.

Draft articles are excluded from the production content database and static routes. Hidden articles keep a direct URL but do not appear on the homepage, in search, RSS feeds, or the gallery.

## License

The code is licensed under MIT. All photography content remains the property of the author.
