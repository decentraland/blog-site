import { useEffect, useRef, useState } from 'react'

/**
 * Hook to preload an image and track when it's ready.
 * Handles browser cache detection and cleanup.
 *
 * @param imageUrl - The URL of the image to load
 * @returns Whether the image has finished loading
 */
const useImageWithLoading = (imageUrl: string | undefined): boolean => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      return
    }

    // Check if image is already cached
    const img = new window.Image()
    imageRef.current = img

    // If complete is true immediately after setting src, image is cached
    img.src = imageUrl

    if (img.complete) {
      setImageLoaded(true)
      return
    }

    // Otherwise wait for load
    setImageLoaded(false)
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageLoaded(true)

    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null
        imageRef.current.onerror = null
      }
    }
  }, [imageUrl])

  return imageLoaded
}

export { useImageWithLoading }
