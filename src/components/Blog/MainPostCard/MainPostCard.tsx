import * as React from 'react'
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

const MainPostCard = React.memo((props: MainPostCardProps) => {
  const { post, loading } = props
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

  if (!post) {
    return null
  }

  return (
    <CardContainer>
      <CardImageLink to={post.url}>
        <CardImage $imageUrl={post.image.url} />
      </CardImageLink>
      <CardInfo>
        <MetaBox>
          <DateText>{post.publishedDate}</DateText>
          <span>
            <CategoryLink to={post.category.url}>{post.category.title}</CategoryLink>
          </span>
        </MetaBox>
        <TitleLink to={post.url}>
          <Typography variant="h3" component="h2">
            {post.title}
          </Typography>
        </TitleLink>
        <Description>{post.description}</Description>
      </CardInfo>
    </CardContainer>
  )
})

export { MainPostCard }
