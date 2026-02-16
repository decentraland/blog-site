import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Button, Typography } from 'decentraland-ui2'
import { SearchResultCard } from '../components/Blog/SearchResultCard'
import { PageLayout } from '../components/PageLayout'
import { SEO } from '../components/SEO'
import { getEnv } from '../config'
import { useSearchBlogPostsQuery } from '../features/search/search.client'
import type { SearchResult } from '../shared/types/blog.domain'
import { CenteredBox, HeaderBox, LoadMoreContainer, ResultsWrapper, SearchSubtitle } from './SearchPage.styled'

const HITS_PER_PAGE = 10

export const SearchPage = () => {
  const { t } = useTranslation()
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
        setAccumulatedResults(prev => [...prev, ...data.results])
      }
    }
  }, [data, page])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    setTimeout(() => window.scrollBy({ top: 500, left: 0, behavior: 'smooth' }), 0)
  }

  const showResults = accumulatedResults.length > 0
  const showEmpty = !isLoading && query.length >= 3 && accumulatedResults.length === 0 && data?.results.length === 0
  const showLoading = isLoading && accumulatedResults.length === 0
  const hasMore = data?.hasMore ?? false

  const searchDescription = query ? t('search.description_with_query', { query }) : t('search.description')
  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  return (
    <PageLayout showBlogNavigation={true}>
      <SEO
        title={query ? t('search.title_with_query', { query }) : t('search.title')}
        description={searchDescription}
        url={query ? `${baseUrl}/search?q=${encodeURIComponent(query)}` : `${baseUrl}/search`}
      />
      {query.length >= 3 && (
        <HeaderBox>
          <SearchSubtitle>
            {t('search.results_for')} <span>&ldquo;{query}&rdquo;</span>
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
            {t('blog.load_more')}
          </Button>
        </LoadMoreContainer>
      )}

      {showEmpty && (
        <CenteredBox>
          <Typography variant="h5" gutterBottom>
            {t('blog.nothing_to_show')}
          </Typography>
          <Typography color="textSecondary">
            {t('search.no_results_for')} &ldquo;{query}&rdquo;
          </Typography>
        </CenteredBox>
      )}
    </PageLayout>
  )
}
