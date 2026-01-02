import { Link } from 'react-router-dom'
import { Box, dclColors, styled } from 'decentraland-ui2'

const SearchContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$hasResults'
})<{ $hasResults: boolean }>(({ theme, $hasResults }) => ({
  position: 'relative',
  width: 'auto',
  zIndex: $hasResults ? theme.zIndex.modal : 1,
  [theme.breakpoints.down('sm')]: {
    width: '100%'
  }
}))

const SearchOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: theme.zIndex.modal - 1
}))

const SearchInputContent = styled(Box)(() => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%'
}))

const SearchInput = styled(Box)(({ theme }) => ({
  width: '300px',
  padding: `${theme.spacing(1.5)} ${theme.spacing(5)} ${theme.spacing(1.5)} ${theme.spacing(2)}`,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: theme.palette.text.primary,
  fontSize: '15px',
  outline: 'none',
  transition: 'all 200ms ease',

  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)'
  },

  '&:focus': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },

  '@media (max-width: 1450px)': {
    width: '100%',
    marginBottom: theme.spacing(2)
  }
})).withComponent('input')

const SearchCloseButton = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1.5),
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '24px',
  cursor: 'pointer',
  padding: theme.spacing(0.5),
  lineHeight: 1,
  transition: 'color 200ms ease',

  '&:hover': {
    color: theme.palette.text.primary
  }
})).withComponent('button')

const SearchResults = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: `calc(100% + ${theme.spacing(1)})`,
  right: 0,
  width: '500px',
  maxWidth: '90vw',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  listStyleType: 'none',
  margin: 0,
  padding: theme.spacing(1),
  maxHeight: '600px',
  overflowY: 'auto',
  zIndex: theme.zIndex.modal + 1,

  '@media (max-width: 1450px)': {
    width: `calc(100vw - ${theme.spacing(6)})`,
    left: 0,
    right: 'auto'
  }
})).withComponent('ul')

const SearchResultItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$selected'
})<{ $selected: boolean }>(({ theme, $selected }) => ({
  borderRadius: theme.spacing(1),
  backgroundColor: $selected ? theme.palette.action.hover : 'transparent',
  transition: 'background-color 200ms ease',
  marginBottom: theme.spacing(0.5),

  '&:last-child': {
    marginBottom: 0
  }
})).withComponent('li')

const SearchResultLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1.5),
  textDecoration: 'none',
  color: 'inherit',
  gap: theme.spacing(1.5)
}))

const SearchResultImage = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$image'
})<{ $image?: string }>(({ theme, $image }) => ({
  width: '80px',
  height: '80px',
  flexShrink: 0,
  borderRadius: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backgroundImage: $image ? `url(${$image})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const SearchResultText = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  overflow: 'hidden'
}))

const SearchResultTitle = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '15px',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',

  '& em': {
    fontStyle: 'normal',
    color: dclColors.base.primary
  }
}))

const SearchResultDescription = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '13px',
  lineHeight: '1.5',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',

  '& em': {
    fontStyle: 'normal',
    color: dclColors.base.primary
  }
}))

const NoResults = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${theme.spacing(5)} ${theme.spacing(2.5)}`,
  textAlign: 'center',
  color: theme.palette.text.secondary,

  '& strong': {
    color: theme.palette.text.primary,
    fontSize: '17px',
    marginBottom: theme.spacing(1)
  },

  '& span': {
    fontSize: '15px'
  }
})).withComponent('li')

const NoResultsImage = styled(Box)(({ theme }) => ({
  fontSize: '48px',
  marginBottom: theme.spacing(2),
  opacity: 0.5
}))

const MoreResultsItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$selected'
})<{ $selected: boolean }>(({ theme, $selected }) => ({
  borderRadius: theme.spacing(1),
  backgroundColor: $selected ? theme.palette.action.hover : 'transparent',
  transition: 'background-color 200ms ease',
  marginTop: theme.spacing(0.5)
})).withComponent('li')

const MoreResultsLink = styled(Link)(({ theme }) => ({
  display: 'block',
  padding: theme.spacing(1.5),
  textAlign: 'center',
  color: dclColors.base.primary,
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'opacity 200ms ease',

  '&:hover': {
    opacity: 0.8
  }
}))

export {
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
}
