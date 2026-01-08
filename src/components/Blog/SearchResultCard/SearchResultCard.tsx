import { Link } from 'react-router-dom'
import type { SearchResultCardProps } from './SearchResultCard.types'
import {
  CardContainer,
  CardContentBox,
  CardDescription,
  CardImage,
  CardTextBox,
  CardTitle,
  LoadingDescription,
  LoadingDescriptionShort,
  LoadingImage,
  LoadingTitle
} from './SearchResultCard.styled'

const SearchResultCard = (props: SearchResultCardProps) => {
  const { result, loading } = props

  if (loading) {
    return (
      <CardContainer>
        <CardContentBox>
          <LoadingImage variant="rectangular" />
          <CardTextBox>
            <LoadingTitle variant="text" />
            <LoadingDescription variant="text" />
            <LoadingDescriptionShort variant="text" />
          </CardTextBox>
        </CardContentBox>
      </CardContainer>
    )
  }

  if (!result) {
    return null
  }

  return (
    <CardContainer>
      <Link to={result.url}>
        <CardContentBox>
          {result.image && <CardImage src={result.image} alt="" />}
          <CardTextBox>
            <CardTitle dangerouslySetInnerHTML={{ __html: result.title }} />
            <CardDescription dangerouslySetInnerHTML={{ __html: result.description }} />
          </CardTextBox>
        </CardContentBox>
      </Link>
    </CardContainer>
  )
}

export { SearchResultCard }
