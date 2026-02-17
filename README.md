# Decentraland Blog Site

React + Vite application for the Decentraland blog.
It renders blog content from the CMS, powers search with Algolia, includes web3 sign-in integrations, and serves crawler-friendly SEO pages through a Vercel serverless function.

![Decentraland Cover](https://decentraland.org/og.jpg)

## Requirements

- Node.js `20.x`
- npm `10.x`

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/blog`.

## Main Routes

- `/` -> redirects to `/blog`
- `/blog`
- `/blog/preview`
- `/blog/search`
- `/blog/sign-in`
- `/blog/author/:authorSlug`
- `/blog/:categorySlug`
- `/blog/:categorySlug/:postSlug`

## Project Structure

- `src/pages`: route pages.
- `src/components`: UI components.
- `src/features`: domain modules (blog, search, profile, web3, notifications).
- `src/config`: environment mapping and helpers.
- `src/services`: API client setup.
- `api/seo.ts`: Vercel SEO serverless function.
- `public`: static assets, service worker, redirects, manifest.
