# leandronsp.com

Static blog site exported from [Curupira](https://github.com/leandronsp/curupira) and deployed to Cloudflare Pages.

<img width="1155" height="854" alt="Screenshot 2025-10-26 at 12 53 18" src="https://github.com/user-attachments/assets/2f38d3df-1c14-41e0-8280-a3e1d8c97279" />


## Overview

This repository contains:
- **Static HTML files** - Pre-rendered blog pages (homepage, articles)
- **Markdown files** - Original article content with YAML frontmatter
- **Assets** - CSS, JavaScript, images

All content is generated and exported from the Curupira blog platform.

## Local Development

Start the nginx server to preview the site:

```bash
docker-compose up
```

Visit: http://localhost:8000

Stop the server:

```bash
docker-compose down
```

## Content Structure

```
.
├── index.html              # Homepage
├── robots.txt              # SEO
├── sitemap.xml             # SEO
├── search-index.json       # Client-side search
├── static-*.js             # JavaScript files
├── assets/
│   └── css/
│       └── app.css         # Optimized CSS
├── images/
│   └── favicon.svg
├── uploads/                # User-uploaded images
└── articles/
    ├── *.html              # Rendered article pages
    └── *.md                # Markdown source files
```

## Updating Content

This repository is automatically updated by the Curupira export process.

From the `curupira` repository:

```bash
# Build + export everything
make export-full

# Or step by step:
make static-build      # Build static HTML/CSS/JS
make export-markdown   # Export articles as markdown
make export-static     # Sync to leandronsp.com
```

Then commit and push changes:

```bash
cd leandronsp.com
git add .
git commit -m "Update site content"
git push
```

## Deployment

### Cloudflare Pages

This repository is connected to Cloudflare Pages for automatic deployment.

**Build settings:**
- Framework preset: None
- Build command: (leave empty)
- Build output directory: `/`

Every push to `main` triggers a new deployment.

## Article Frontmatter

Each markdown file includes YAML frontmatter:

```yaml
---
title: "Article Title"
slug: "article-slug"
published_at: "2024-10-20 12:00:00Z"
language: "en"
status: "published"
tags: ["tag1", "tag2"]
---
```

## Nginx Configuration

The `nginx.conf` file includes:
- Gzip compression
- Cache headers for static assets
- Security headers
- SPA-style routing for articles
- .git and .md file blocking

## Features

- ✅ SEO optimized (Open Graph, Twitter Cards, JSON-LD)
- ✅ Client-side search
- ✅ Dark/light theme toggle
- ✅ Language filtering (PT/EN)
- ✅ Responsive design
- ✅ Optimized CSS (purged + minified)
- ✅ Sitemap.xml + robots.txt

## PageSpeed

<img width="998" height="908" alt="Screenshot 2025-10-26 at 12 52 56" src="https://github.com/user-attachments/assets/ab92f1b9-0967-40fc-b65b-b8b6e298a327" />


## Source

All content originates from the [Curupira blog platform](https://github.com/leandronsp/curupira).

## License

Content: All rights reserved
Code: AGPL-3.0
