import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Typography } from 'decentraland-ui2'
import { SearchResultCard } from '../components/Blog/SearchResultCard'
import { PageLayout } from '../components/PageLayout'
import { useSearchBlogPostsQuery } from '../features/search/search.client'
import { CenteredBox, HeaderBox, LoadMoreContainer, ResultsWrapper, SearchSubtitle } from './SearchPage.styled'
import type { SearchResult } from '../shared/types/blog.domain'

const HITS_PER_PAGE = 10

export const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [accumulatedResults, setAccumulatedResults] = useState<SearchResult[]>([])

  const query = useMemo(() => searchParams.get('q') || '', [searchParams])

  const { data, isLoading, isFetching } = useSearchBlogPostsQuery(
    {
      query,
      hitsPerPage: HITS_PER_PAGE,
      page
    },
    { skip: query.length < 3 }
  )

  // Reset accumulated results when query changes
  useEffect(() => {
    setPage(0)
    setAccumulatedResults([])
  }, [query])

  // Accumulate results when data changes
  useEffect(() => {
    if (data?.results) {
      if (page === 0) {
        setAccumulatedResults(data.results)
      } else {
        setAccumulatedResults((prev) => [...prev, ...data.results])
      }
    }
  }, [data, page])

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
    setTimeout(() => window.scrollBy({ top: 500, left: 0, behavior: 'smooth' }), 0)
  }

  const showResults = accumulatedResults.length > 0
  const showEmpty = !isLoading && query.length >= 3 && accumulatedResults.length === 0 && data?.results.length === 0
  const showLoading = isLoading && accumulatedResults.length === 0
  const hasMore = data?.hasMore ?? false

  return (
    <PageLayout showBlogNavigation={true}>
      {query.length >= 3 && (
        <HeaderBox>
          <SearchSubtitle>
            Search results for <span>&ldquo;{query}&rdquo;</span>
          </SearchSubtitle>
        </HeaderBox>
      )}

      {showLoading && (
        <ResultsWrapper>
          {Array.from({ length: 5 }, (_, index) => (
            <SearchResultCard key={index} loading />
          ))}
        </ResultsWrapper>
      )}

      {showResults && (
        <ResultsWrapper>
          {accumulatedResults.map((result, index) => (
            <SearchResultCard key={`${result.url}-${index}`} result={result} />
          ))}
        </ResultsWrapper>
      )}

      {isFetching && !isLoading && (
        <ResultsWrapper>
          {Array.from({ length: 3 }, (_, index) => (
            <SearchResultCard key={`loading-more-${index}`} loading />
          ))}
        </ResultsWrapper>
      )}

      {hasMore && showResults && !isFetching && (
        <LoadMoreContainer>
          <Button variant="contained" onClick={handleLoadMore}>
            Load More
          </Button>
        </LoadMoreContainer>
      )}

      {showEmpty && (
        <CenteredBox>
          <Typography variant="h5" gutterBottom>
            Nothing to show
          </Typography>
          <Typography color="textSecondary">No results found for &ldquo;{query}&rdquo;</Typography>
        </CenteredBox>
      )}
    </PageLayout>
  )
}
