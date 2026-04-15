export function contentfulImageUrl(
  url: string,
  options: { width?: number; height?: number; format?: 'webp' | 'avif' | 'jpg'; quality?: number; fit?: 'fill' | 'pad' | 'scale' | 'crop' }
): string {
  const base = url.startsWith('//') ? `https:${url}` : url
  const parsed = new URL(base)
  if (options.width) parsed.searchParams.set('w', String(options.width))
  if (options.height) parsed.searchParams.set('h', String(options.height))
  if (options.format) parsed.searchParams.set('fm', options.format)
  if (options.quality) parsed.searchParams.set('q', String(options.quality))
  if (options.fit) parsed.searchParams.set('fit', options.fit)
  return parsed.toString()
}
