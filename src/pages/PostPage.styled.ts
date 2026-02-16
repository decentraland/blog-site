/* eslint-disable @typescript-eslint/naming-convention */
import { Link } from 'react-router-dom'
import { Box, Typography, styled } from 'decentraland-ui2'

const CenteredBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8)
}))

const ContentContainer = styled(Box)(({ theme }) => ({
  maxWidth: theme.spacing(96),
  width: '100%',
  margin: '0 auto',
  padding: 0,
  [theme.breakpoints.down('xs')]: {
    padding: `${theme.spacing(4)} ${theme.spacing(2)}`
  }
}))

const HeaderBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5)
}))

const MetaText = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.primary,
  letterSpacing: theme.typography.caption.letterSpacing,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const MetaSeparator = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary
}))

const CategoryMetaLink = styled(Link)(({ theme }) => ({
  color: '#5c5c6e',
  textDecoration: 'none',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': {
    textDecoration: 'underline'
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const TitleBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1.5)
}))

const TitleText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary
}))

const SubtitleText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginTop: theme.spacing(1)
}))

const PostImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 'auto',
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(5),
  objectFit: 'cover',
  backgroundColor: theme.palette.background.paper
}))

const AuthorBox = styled(Box)(() => ({}))

const AuthorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(5)
}))

const AuthorLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  textDecoration: 'none',
  color: theme.palette.text.primary,
  WebkitTapHighlightColor: 'transparent',
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const AuthorAvatar = styled('img')(({ theme }) => ({
  width: theme.spacing(4),
  height: theme.spacing(4),
  borderRadius: '50%',
  objectFit: 'cover',
  backgroundColor: theme.palette.background.default
}))

const AuthorName = styled(Typography)(({ theme }) => ({
  ...theme.typography.body1,
  color: theme.palette.text.primary
}))

const BodyContainer = styled(Box)(() => ({}))

const ShareContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5)
}))

const ShareLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase'
}))

const ShareLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.text.primary
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

export {
  AuthorAvatar,
  AuthorBox,
  AuthorLink,
  AuthorName,
  AuthorRow,
  BodyContainer,
  CategoryMetaLink,
  CenteredBox,
  ContentContainer,
  HeaderBox,
  MetaSeparator,
  MetaText,
  PostImage,
  ShareContainer,
  ShareLabel,
  ShareLink,
  SubtitleText,
  TitleBox,
  TitleText
}
