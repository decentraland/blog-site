import type { BlogPost } from '../types/blog.domain'

const BASE_URL = '/blog'

export const locations = {
  home: () => '/',
  blogs: () => BASE_URL,
  category: (categorySlug: string) => `${BASE_URL}/${categorySlug}`,
  blog: (categorySlug: string, postSlug: string) => `${BASE_URL}/${categorySlug}/${postSlug}`,
  author: (authorId: string) => `${BASE_URL}/author/${authorId}`,
  search: (query: string) => `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
  twitter: (post: BlogPost) => {
    const url = `${window.location.origin}${post.url}`
    return `https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`
  },
  facebook: (post: BlogPost) => {
    const url = `${window.location.origin}${post.url}`
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  }
}
