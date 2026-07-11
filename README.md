# Minimalist Photography Blog

A narrative-driven photography blog and digital gallery. The site presents photo stories in a responsive card feed, with dedicated article pages and full, non-cropped image collections.

## Features

- Responsive photography post feed
- Markdown-based articles with typed frontmatter
- Image previews and a lightweight custom carousel
- Full gallery using a CSS multi-column layout
- Custom image lightbox
- Dark and light themes
- Static generation and automatic GitHub Pages deployment
- Images hosted on Cloudflare R2

## Tech Stack

| Area | Implementation |
| :--- | :--- |
| Framework | Nuxt 4 and Vue 3 |
| Content | Nuxt Content 3 with Markdown |
| Validation | Zod |
| Gallery | Vue components and CSS multi-column layout |
| Image viewer | Custom Vue lightbox |
| Storage | Cloudflare R2 |
| Hosting | GitHub Pages |

## Project Structure

```text
.
├── assets/css/             # Global styles
├── components/
│   ├── gallery/           # Carousel, gallery, and lightbox
│   └── layout/            # Header and post previews
├── content/blog/           # Markdown photography stories
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

## Publishing Workflow

1. Upload exported images to Cloudflare R2.
2. Add a Markdown file under `content/blog/` and define its metadata and image URLs in frontmatter.
3. Push to `main`; GitHub Actions generates the static site and deploys it to GitHub Pages.

## License

The code is licensed under MIT. All photography content remains the property of the author.
