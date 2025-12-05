import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchBlogQuery } from '../../../features/search/search.client'
import type { SearchProps } from './Search.types'
import {
  MoreResultsItem,
  MoreResultsLink,
  NoResults,
  NoResultsImage,
  SearchCloseButton,
  SearchContainer,
  SearchInput,
  SearchInputContent,
  SearchOverlay,
  SearchResultDescription,
  SearchResultImage,
  SearchResultItem,
  SearchResultLink,
  SearchResultText,
  SearchResultTitle,
  SearchResults
} from './Search.styled'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const errorValue = error.error
    if (typeof errorValue === 'string') {
      return errorValue
    }
  }
  return 'Something went wrong. Please try again.'
}

const Search = ({ placeholder = 'Search...', onClose }: SearchProps) => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [debouncedValue, setDebouncedValue] = useState('')

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  const {
    data: searchResults = [],
    isLoading,
    error,
    isError
  } = useSearchBlogQuery({ query: debouncedValue, hitsPerPage: 5, page: 0 }, { skip: debouncedValue.trim().length <= 2 })

  const handleClose = useCallback(() => {
    setSearchValue('')
    setSelectedIndex(-1)
    onClose?.()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxLength = searchResults.length > 3 ? 4 : searchResults.length

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev <= 0 ? maxLength : prev - 1))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev >= maxLength ? 0 : prev + 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex === 4 || selectedIndex === -1) {
          navigate(`/blog/search?q=${encodeURIComponent(searchValue)}`)
        } else if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          const result = searchResults[selectedIndex]
          navigate(`/blog/${result.categoryId}/${result.id}`)
        }
        handleClose()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    },
    [searchValue, selectedIndex, searchResults, navigate, handleClose]
  )

  const showResults = searchValue.trim().length > 2
  const hasResults = searchResults.length > 0

  return (
    <SearchContainer $hasResults={showResults}>
      {showResults && <SearchOverlay onClick={handleClose} />}
      <SearchInputContent>
        <SearchInput
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {searchValue && (
          <SearchCloseButton onClick={handleClose} aria-label="Clear search">
            ×
          </SearchCloseButton>
        )}
      </SearchInputContent>

      {showResults && (
        <SearchResults>
          {isLoading && (
            <NoResults>
              <span>Searching...</span>
            </NoResults>
          )}

          {!isLoading && isError && (
            <NoResults>
              <NoResultsImage>⚠️</NoResultsImage>
              <strong>Search error</strong>
              <span>{getErrorMessage(error)}</span>
            </NoResults>
          )}

          {!isLoading && !isError && !hasResults && (
            <NoResults>
              <NoResultsImage>🔍</NoResultsImage>
              <strong>No matches</strong>
              <span>Try searching for something else</span>
            </NoResults>
          )}

          {!isLoading &&
            !isError &&
            hasResults &&
            searchResults.slice(0, 4).map((result, index) => (
              <SearchResultItem key={result.id} $selected={index === selectedIndex} onMouseEnter={() => setSelectedIndex(index)}>
                <SearchResultLink to={`/blog/${result.categoryId}/${result.id}`} onClick={handleClose}>
                  <SearchResultImage $image={result.image} />
                  <SearchResultText>
                    <SearchResultTitle dangerouslySetInnerHTML={{ __html: result.highlightedTitle }} />
                    <SearchResultDescription
                      dangerouslySetInnerHTML={{
                        __html: result.highlightedDescription
                      }}
                    />
                  </SearchResultText>
                </SearchResultLink>
              </SearchResultItem>
            ))}

          {!isLoading && !isError && searchResults.length > 4 && (
            <MoreResultsItem $selected={selectedIndex === 4} onMouseEnter={() => setSelectedIndex(4)}>
              <MoreResultsLink to={`/blog/search?q=${encodeURIComponent(searchValue)}`} onClick={handleClose}>
                See more results
              </MoreResultsLink>
            </MoreResultsItem>
          )}
        </SearchResults>
      )}
    </SearchContainer>
  )
}

export { Search }
