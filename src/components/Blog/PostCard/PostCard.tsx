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
      <CardImageLink to={post!.url}>
        <CardImage src={post!.image.url} alt={post!.title} loading="lazy" decoding="async" />
      </CardImageLink>
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
