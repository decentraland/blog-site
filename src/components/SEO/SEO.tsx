import { Helmet } from 'react-helmet'
import type { SEOProps } from './SEO.types'

const DEFAULT_IMAGE = 'https://decentraland.org/images/decentraland.png'
const SITE_NAME = 'Decentraland Blog'
const BASE_URL = 'https://decentraland.org/blog'

function SEO({ title, description, image = DEFAULT_IMAGE, type = 'website', url, author, publishedTime, modifiedTime }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = url || BASE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific meta tags */}
      {type === 'article' && author && <meta property="article:author" content={author} />}
      {type === 'article' && publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {type === 'article' && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
    </Helmet>
  )
}

export { SEO }
