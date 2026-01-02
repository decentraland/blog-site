import { useEffect, useRef, useState } from 'react'
import { Typography } from 'decentraland-ui2'
import type { PostCardProps } from './PostCard.types'
import {
  CardContainer,
  CardImage,
  CardImageLink,
  CardInfo,
  CategoryLink,
  DateText,
  LoadingHeader,
  LoadingImage,
  LoadingMetaSkeleton,
  LoadingTextSkeleton,
  LoadingTextSkeletonShort,
  MetaBox,
  TitleLink
} from './PostCard.styled'

const PostCard = (props: PostCardProps) => {
  const { post, loading } = props
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Preload image and track when it's ready
  useEffect(() => {
    if (!post?.image?.url) {
      return
    }

    // Check if image is already cached
    const img = new window.Image()
    imageRef.current = img

    // If complete is true immediately after setting src, image is cached
    img.src = post.image.url

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
  }, [post?.image?.url])

  // Full skeleton when loading prop is true (no data yet)
  if (loading) {
    return (
      <CardContainer elevation={0}>
        <LoadingImage variant="rectangular" />
        <CardInfo>
          <LoadingHeader>
            <LoadingMetaSkeleton variant="text" />
            <LoadingMetaSkeleton variant="text" />
          </LoadingHeader>
          <LoadingTextSkeleton variant="text" />
          <LoadingTextSkeletonShort variant="text" />
        </CardInfo>
      </CardContainer>
    )
  }

  return (
    <CardContainer elevation={0}>
      {imageLoaded ? (
        <CardImageLink to={post!.url}>
          <CardImage $imageUrl={post!.image.url} />
        </CardImageLink>
      ) : (
        <LoadingImage variant="rectangular" />
      )}
      <CardInfo>
        <MetaBox>
          <DateText>{post!.publishedDate}</DateText>
          <span>
            <CategoryLink to={post!.category.url}>{post!.category.title}</CategoryLink>
          </span>
        </MetaBox>
        <TitleLink to={post!.url}>
          <Typography variant="h6" component="h2">
            {post!.title}
          </Typography>
        </TitleLink>
      </CardInfo>
    </CardContainer>
  )
}

export { PostCard }
