# AI Agent Context

**Service Purpose:**

The Blog Site is a Vite/React single-page application that serves the Decentraland blog at `decentraland.org/blog`. It renders blog posts, categories, author pages, and search results sourced from Contentful CMS. A Vercel serverless function (`api/seo.ts`) provides pre-rendered HTML with correct Open Graph and Twitter meta tags for crawlers and social media previews.

**Key Capabilities:**

- Blog post listing with infinite scroll pagination, filtered by category or author
- Individual post pages with rich-text body rendering (Contentful rich-text-react-renderer), embedded assets, and related posts
- Category browse pages showing all posts under a given category
- Author profile pages listing all posts by a given author
- Full-text search via Algolia (minimum 3 characters required, results with image and category resolution)
- Post preview mode for Contentful draft content (using a preview access token)
- SEO serverless function: detects crawlers by User-Agent and serves pre-rendered HTML with route-specific meta tags fetched from the CMS REST API
- Wallet-based authentication via Magic SDK and WalletConnect (wagmi/viem)
- Decentraland notification bell (in-app notifications from the Notifications API)
- Responsive layout with mobile-specific breakpoints

**Communication Pattern:**

- Pure client-side SPA (Vite); no server-side rendering on the React app itself
- Data fetching uses RTK Query with two API clients: `cmsClient` (Contentful REST) and `algoliaClient` (Algolia SDK via `fakeBaseQuery`)
- In development, Vite proxies `/api/cms` to avoid CORS; in production the app calls the Contentful CMS URL directly
- SEO is handled separately by the Vercel serverless function at `api/seo.ts`, which is triggered for crawler User-Agents and fetches CMS data server-side
- Profile data is fetched from the Decentraland Catalyst peer lambdas endpoint

**Technology Stack:**

- Runtime: Node.js 20.x
- Language: TypeScript 5.5
- Frontend Framework: React 18 with React Router DOM 7
- State Management: Redux Toolkit (RTK Query for data fetching, redux-persist for persistence)
- Styling: decentraland-ui2 component library (MUI-based)
- CMS: Contentful (REST API via `@contentful/rich-text-react-renderer`)
- Search: Algolia (`algoliasearch` v5)
- Auth: Magic SDK + wagmi/viem + WalletConnect
- Serverless: Vercel (`@vercel/node`) for the SEO function
- Testing: Jest 29 + ts-jest
- Linting: ESLint 9 + Prettier, Husky pre-commit hooks

**External Dependencies:**

- Contentful CMS REST API (`cms.decentraland.org/spaces/ea2ybdmmn1kv/environments/master`) — blog posts, categories, authors, assets
- Algolia (`1H67SAMO2T` app) — full-text search index `blog_contentful_prd`
- Decentraland Catalyst peer (`peer.decentraland.org/lambdas/profiles/:address`) — user avatar/profile data
- Decentraland Notifications API (`notifications.decentraland.org`) — in-app notification bell
- Magic SDK — email/social OAuth login
- WalletConnect / wagmi — wallet-based login
- Segment — analytics event tracking

**Key Concepts:**

- **CMS entry resolution**: Contentful entries use linked fields (category, author, image) that are returned as `{sys: {type: "Link", id}}` references. The blog client (`src/features/blog/blog.client.ts`) resolves these links in parallel by fetching each linked entry/asset separately before mapping to domain types.
- **Normalized post store**: Resolved `BlogPost` objects are upserted into a Redux entity adapter slice (`blog.slice.ts`) so that the same post fetched in a list and in a detail view shares one cached copy.
- **RTK Query tag cache**: `BlogPosts`/`BlogPost`/`Categories`/`Authors` tags control cache invalidation. List queries use `serializeQueryArgs` keyed on category/author to support merge-based infinite scroll.
- **Infinite scroll pagination**: `useInfiniteBlogPosts.ts` tracks `nextCmsSkip` and calls the RTK Query endpoint with increasing `skip` values; results are merged into the accumulated list.
- **SEO function route parsing**: `api/seo.ts` parses URL patterns (`/blog`, `/blog/:category`, `/blog/:category/:post`, `/blog/author/:slug`, `/blog/search`) to fetch the correct CMS entity and inject Open Graph/Twitter meta tags into the static `index.html`.
- **Preview mode**: `PreviewPage` uses `getBlogPostPreview` which calls the Contentful Preview API (separate base URL + preview access token) to render unpublished drafts.
- **Slug resolution**: CMS entries use either a `slug` field or an `id` field as the URL slug; the helper `getEntrySlug` checks both in order.

**Out of Scope:**

- No server-side rendering or static site generation (Gatsby/Next.js is not used)
- No database or backend server; all data comes from Contentful or Algolia
- No event management, marketplace, or metaverse world features
- No image upload or CMS content authoring
- No push notifications (only in-app bell from the Notifications API)

**Project Structure:**

```
src/
  app/           Redux store setup
  components/
    Blog/        Blog-specific UI: BlogNavigation, CategoryHero, MainPostCard,
                 PostCard, PostList, RelatedPost, RichText, Search, SearchResultCard
    PageLayout/  Top-level page shell (header, footer, routing wrapper)
    SEO/         React Helmet-based meta tag component
  config/
    env/         dev.json, prd.json (per-environment variables loaded by @dcl/ui-env)
    index.ts     config accessor
  features/
    blog/        blog.client.ts (RTK Query), blog.slice.ts (entity adapter),
                 blog.mappers.ts, blog.helpers.ts, blog.types.ts, cms.types.ts,
                 useInfiniteBlogPosts.ts
    search/      search.client.ts (Algolia RTK Query), search.types.ts
    profile/     profile.client.ts (Catalyst peer fetch)
    web3/        web3.config.ts (wagmi/viem chain config)
    notifications/ usePageNotifications.tsx
  pages/         AuthorPage, BlogPage, CategoryPage, PostPage, PreviewPage,
                 SearchPage, SignInRedirect (each with .tsx and .styled.ts)
  services/
    client.ts    cmsClient and algoliaClient RTK Query base instances
  shared/
    types/       blog.domain.ts (BlogPost, BlogCategory, BlogAuthor, etc.)
  intl/          i18n message definitions
api/
  seo.ts         Vercel serverless function for crawler SEO
```

**Configuration:**

Key environment variables (defined in `src/config/env/dev.json` and `prd.json`):

| Variable | Purpose |
|---|---|
| `CMS_BASE_URL` | Contentful REST API base URL |
| `ALGOLIA_APP_ID` | Algolia application ID |
| `ALGOLIA_API_KEY` | Algolia search-only API key |
| `ALGOLIA_BLOG_INDEX` | Algolia index name for blog posts |
| `AUTH_URL` | Decentraland SSO auth endpoint |
| `PEER_URL` | Decentraland Catalyst peer URL (for profile fetching) |
| `NOTIFICATIONS_API_URL` | Decentraland Notifications API |
| `MAGIC_API_KEY` | Magic SDK publishable key |
| `WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID |
| `SEGMENT_API_KEY` | Segment analytics write key |

**Testing:**

- Framework: Jest 29 with ts-jest
- Entry point: `src/dummy.test.ts` (placeholder; feature tests co-located with feature files)
- Run: `npm test` / `npm run test:coverage`
- No E2E test setup present; unit tests focus on mappers, helpers, and selectors
