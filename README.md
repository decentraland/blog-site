# Decentraland Blog UI

UI application for the Decentraland blog.

This project renders blog content, category and author pages, search results, and SEO metadata for crawlers.

## Table of Contents

- [Features](#features)
- [Dependencies & Related Services](#dependencies--related-services)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the UI](#running-the-ui)
- [Testing](#testing)
- [Main Routes](#main-routes)
- [Project Structure](#project-structure)

## Features

- Browse Decentraland blog posts by category and author.
- Search blog posts with Algolia.
- Support sign-in redirects and web3 wallet integrations.
- Serve crawler-friendly SEO metadata using `api/seo.ts`.

## Dependencies & Related Services

This UI interacts with the following services:

- **CMS API** (`CMS_BASE_URL`): source of posts, categories, and authors.
- **Algolia** (`ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_BLOG_INDEX`): blog search index.
- **Auth service** (`AUTH_URL`): login flow and redirect handling.
- **Notifications API** (`NOTIFICATIONS_API_URL`): page notifications.
- **Peer API** (`PEER_URL`): profile-related information.

## Getting Started

### Prerequisites

Before running this UI, ensure you have the following installed:

- **Node.js**: `20.x`
- **npm**: `10.x`

### Installation

1. Clone the repository:

```bash
git clone https://github.com/decentraland/blog-site.git
cd blog-site
```

2. Install dependencies:

```bash
npm install
```

### Configuration

The UI uses `@dcl/ui-env` to resolve environment values.

Environment files are under `src/config/env`:

- `dev.json`
- `stg.json`
- `prd.json`

To select the starting environment in development, set `VITE_REACT_APP_DCL_DEFAULT_ENV` in `.env`.

Example:

```bash
VITE_REACT_APP_DCL_DEFAULT_ENV=dev
```

### Running the UI

Run the Vite development server:

```bash
npm run start
```

Then open the URL shown by Vite in your terminal and navigate to `/blog` (for example: `http://localhost:5173/blog` or `http://127.0.0.1:5173/blog`).

## Testing

This UI includes Jest tests for components and business logic.

Run all tests:

```bash
npm run test
```

Run all tests with coverage:

```bash
npm run test:coverage
```

### Test Structure

Tests are written as `*.test.ts` or `*.test.tsx` files, typically close to the code they validate.

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
- `public`: static assets, redirects, manifest.
