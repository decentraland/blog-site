import { Document } from '@contentful/rich-text-types'
import { formatUtcDate } from '../../shared/utils/date'
import { locations } from '../../shared/utils/locations'
import { slugify } from '../../shared/utils/string'
import type { CMSEntry } from './cms.types'
import type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset } from '../../shared/types/blog.domain'

interface ContentfulAssetEntry {
  sys: {
    id: string
    type: string
  }
  fields: {
    file?: {
      url?: string
      contentType?: string
      details?: {
        image?: {
          width?: number
          height?: number
        }
      }
    }
  }
}

function mapContentfulAsset(asset: ContentfulAssetEntry | null | undefined): ContentfulAsset | null {
  if (!asset || !asset.sys || !asset.fields || !asset.fields.file) {
    return null
  }

  const url = asset.fields.file.url
  if (!url) {
    return null
  }

  return {
    id: asset.sys.id,
    url: url.startsWith('//') ? `https:${url}` : url,
    width: asset.fields.file.details?.image?.width || 0,
    height: asset.fields.file.details?.image?.height || 0,
    mimeType: asset.fields.file.contentType || 'image/jpeg'
  }
}

function mapBlogCategory(entry: CMSEntry | null | undefined): BlogCategory | null {
  if (!entry || !entry.sys || !entry.fields) {
    return null
  }

  const slug = (entry.fields.id as string | undefined) || slugify((entry.fields.title as string | undefined) || '')
  if (!slug) {
    return null
  }

  const image = mapContentfulAsset(entry.fields.image as ContentfulAssetEntry | null | undefined)
  if (!image) {
    return null
  }

  return {
    id: entry.sys.id,
    slug,
    title: (entry.fields.title as string | undefined) || '',
    description: (entry.fields.description as string | undefined) || '',
    image,
    isShownInMenu: (entry.fields.isShownInMenu as boolean | undefined) ?? true,
    url: '' // TODO: add this after adding the blog category page -> locations.category(slug)
  }
}

function createDefaultCategory(entryId?: string): BlogCategory {
  return {
    id: entryId || 'uncategorized',
    slug: 'uncategorized',
    title: 'Uncategorized',
    description: 'Posts without a valid category',
    image: {
      id: 'default-category-image',
      url: 'https://decentraland.org/logos/png/color.png',
      width: 200,
      height: 200,
      mimeType: 'image/png'
    },
    isShownInMenu: false,
    url: '' // TODO: add this after adding the blog category page -> locations.category('uncategorized')
  }
}

function createDefaultImage(entryId?: string): ContentfulAsset {
  return {
    id: entryId || 'default-image',
    url: 'https://decentraland.org/logos/png/color.png',
    width: 1200,
    height: 630,
    mimeType: 'image/png'
  }
}

function createDefaultAuthor(entryId?: string): BlogAuthor {
  const slug = entryId || 'decentraland'
  return {
    id: entryId || 'unknown',
    slug,
    title: 'Decentraland',
    description: 'Decentraland Team',
    image: {
      id: 'default-avatar',
      url: 'https://decentraland.org/logos/png/color.png',
      width: 200,
      height: 200,
      mimeType: 'image/png'
    },
    url: locations.author(slug)
  }
}

function mapBlogAuthor(entry: CMSEntry | null | undefined): BlogAuthor {
  if (!entry || !entry.sys || !entry.fields) {
    return createDefaultAuthor(entry?.sys?.id)
  }

  // Check if fields object is empty
  const fieldKeys = Object.keys(entry.fields)
  if (fieldKeys.length === 0) {
    return createDefaultAuthor(entry.sys.id)
  }

  // Extract title and slug BEFORE checking image
  const title = (entry.fields.title as string | undefined) || ''
  const slug = (entry.fields.id as string | undefined) || slugify(title) || entry.sys.id

  const image = mapContentfulAsset(entry.fields.image as ContentfulAssetEntry | null | undefined)
  if (!image) {
    // Use the actual author data but with a default image
    return {
      id: entry.sys.id,
      slug,
      title: title || 'Decentraland',
      description: (entry.fields.description as string | undefined) || '',
      image: {
        id: 'default-avatar',
        url: 'https://decentraland.org/logos/png/color.png',
        width: 200,
        height: 200,
        mimeType: 'image/png'
      },
      url: locations.author(slug)
    }
  }

  return {
    id: entry.sys.id,
    slug,
    title,
    description: (entry.fields.description as string | undefined) || '',
    image,
    url: locations.author(slug)
  }
}

function mapBlogPost(entry: CMSEntry | null | undefined): BlogPost | null {
  if (!entry || !entry.sys || !entry.fields) {
    return null
  }

  // Try to map category, fall back to default if it fails
  let category = mapBlogCategory(entry.fields.category as CMSEntry | null | undefined)
  if (!category) {
    category = createDefaultCategory(entry.sys.id)
  }

  // mapBlogAuthor now always returns a valid author (falls back to default if needed)
  const author = mapBlogAuthor(entry.fields.author as CMSEntry | null | undefined)

  // Try to map image, fall back to default if it fails
  let image = mapContentfulAsset(entry.fields.image as ContentfulAssetEntry | null | undefined)
  if (!image) {
    image = createDefaultImage(entry.sys.id)
  }

  const title = (entry.fields.title as string | undefined) || ''
  const slug = (entry.fields.slug as string | undefined) || slugify(title)
  if (!slug) {
    return null
  }
  const publishedDate = entry.fields.publishedDate as string | undefined
  const body = entry.fields.body as Document | undefined

  return {
    id: entry.sys.id,
    slug,
    title,
    description: (entry.fields.description as string | undefined) || '',
    publishedDate: formatUtcDate(publishedDate),
    body: body || ({} as Document),
    bodyAssets: {},
    image,
    category,
    author,
    url: locations.blog(category.slug, slug)
  }
}

export { mapBlogAuthor, mapBlogCategory, mapBlogPost, mapContentfulAsset }
