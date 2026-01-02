import { useEffect, useRef, useState } from 'react'
import { Typography } from 'decentraland-ui2'
import type { MainPostCardProps } from './MainPostCard.types'
import {
  CardContainer,
  CardImage,
  CardImageLink,
  CardInfo,
  CategoryLink,
  DateText,
  Description,
  LoadingContentBox,
  LoadingHeader,
  LoadingImage,
  LoadingMetaSkeleton,
  LoadingTextSkeleton,
  LoadingTextSkeletonShort,
  LoadingTitleLine,
  LoadingTitleLineShort,
  MetaBox,
  TitleLink
} from './MainPostCard.styled'

const MainPostCard = (props: MainPostCardProps) => {
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
      <CardContainer>
        <LoadingImage variant="rectangular" />
        <CardInfo>
          <LoadingHeader>
            <LoadingMetaSkeleton variant="text" />
            <LoadingMetaSkeleton variant="text" />
          </LoadingHeader>
          <LoadingTitleLine variant="text" />
          <LoadingTitleLineShort variant="text" />
          <LoadingContentBox>
            <LoadingTextSkeleton variant="text" />
            <LoadingTextSkeleton variant="text" />
            <LoadingTextSkeleton variant="text" />
            <LoadingTextSkeletonShort variant="text" />
          </LoadingContentBox>
        </CardInfo>
      </CardContainer>
    )
  }

  return (
    <CardContainer>
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
          <Typography variant="h3" component="h2">
            {post!.title}
          </Typography>
        </TitleLink>
        <Description>{post!.description}</Description>
      </CardInfo>
    </CardContainer>
  )
}

export { MainPostCard }
