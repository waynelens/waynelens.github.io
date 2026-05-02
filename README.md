# Minimalist Photography Blog

A narrative-driven digital gallery designed specifically for photographers. Featuring a "Preview-Left, Narrative-Right" dual-column design for desktop and an Instagram-style immersive experience for mobile.

## 🌟 Core UX Design Philosophy

- **Visual Anchor (Visual-First)**: The homepage utilizes a split-screen layout. On desktop, the left side features an interactive image carousel, allowing readers to quickly preview the essence of a post without leaving the page.
- **Mobile-Native**: The mobile experience is optimized as a vertical card feed, mimicking the familiar browsing logic of Instagram.
- **Narrative Experience**: Inside the post, text and high-definition imagery are interwoven, providing an ultimate viewing experience via PhotoSwipe 5 integration.
- **Full Collection**: Every post ends with a non-cropped masonry gallery, ensuring the integrity of the photographer’s original composition.

---

## 🛠 Tech Stack

| Domain | Solution | Notes |
| :--- | :--- | :--- |
| **Framework** | [Nuxt 3](https://nuxt.com/) | Static Site Generation (SSG) deployed on GitHub Pages |
| **UI Foundation** | [Shadcn Vue](https://www.shadcn-vue.com/) | Minimalist and modern UI components |
| **Carousel** | [Embla Carousel](https://www.emblacarousel.com/) | Lightweight, extensible carousel for quick previews |
| **Lightbox** | [PhotoSwipe 5](https://photoswipe.com/) | Top-tier gesture zooming and large image viewing |
| **CMS** | [Nuxt Content v2](https://content.nuxt.com/) | Markdown + Git-based content management |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | Efficient S3-compatible storage with zero egress fees |
| **Grid System** | [Vue Masonry Wall](https://github.com/yeger/vue-masonry-wall) | Non-cropped gallery display for post footers |

---

## 📁 Project Structure (UX-Focused)

```text
.
├── components/
│   ├── ui/                 # Shadcn base components
│   ├── gallery/
│   │   ├── PreviewCarousel.vue # Desktop left-side carousel (Embla)
│   │   ├── PostGallery.vue     # Full masonry gallery at post end
│   │   └── Lightbox.vue        # PhotoSwipe wrapper
│   └── layout/
│       ├── AppHeader.vue       # Nav bar (i18n + Theme toggle)
│       └── PostCard.vue        # Responsive index card (Dual-column)
├── content/                # Markdown articles (.md)
├── pages/
│   ├── index.vue           # Homepage (Instagram-style browsing)
│   └── blog/
│       └── [...slug].vue   # Immersive article page
└── nuxt.config.ts          # Core config & PWA settings
```

---

## 📸 UX Architecture

### 1. Homepage Preview (Index Page)
- **Desktop (Dual-Column)**: 
  - **Left**: `PreviewCarousel` allowing readers to swipe through highlights immediately.
  - **Right**: `Sticky` information column with title, narrative snippet, hashtags, and links.
- **Mobile (Vertical Feed)**: 
  - **Instagram Style**: Image carousel on top, followed by text metadata and navigation buttons.

### 2. Post Detail
- A top-to-bottom vertical reading flow supporting full-width imagery.
- All embedded images support "Click to Zoom" via `PhotoSwipe`.

### 3. Post Footer (The Collection)
- Showcases the "Complete Gallery" of the series.
- Uses `Masonry` layout to **strictly maintain original aspect ratios (No Cropping)**.

---

## 🚀 Workflow

1. **Upload**: Export high-quality AVIF/P3 photos and upload them to Cloudflare R2.
2. **Write**: Create Markdown files in `content/` with `images: [...]` defined in Frontmatter.
3. **Deploy**: `git push` to main. GitHub Actions triggers SSG and deploys to GitHub Pages.

---

## ⚖️ License
The code is licensed under MIT; all photography content remains the property of the author.