import { styled } from 'decentraland-ui2'

const Paragraph = styled('p')(({ theme }) => ({
  ...theme.typography.body1,
  lineHeight: 2,
  letterSpacing: '-0.2px',
  marginTop: theme.spacing(2.5),
  marginBottom: 0
}))

const Heading1 = styled('h1')(({ theme }) => ({
  ...theme.typography.h1,
  fontSize: theme.typography.pxToRem(40),
  fontWeight: 700,
  lineHeight: 1.17,
  marginTop: 0,
  paddingTop: theme.spacing(1.375),
  marginBottom: 0
}))

const Heading2 = styled('h2')(({ theme }) => ({
  ...theme.typography.h2,
  fontSize: theme.typography.pxToRem(32),
  fontWeight: 700,
  lineHeight: 1.17,
  marginTop: 0,
  paddingTop: theme.spacing(1.375),
  marginBottom: 0
}))

const Heading3 = styled('h3')(({ theme }) => ({
  ...theme.typography.h3,
  fontSize: theme.typography.pxToRem(28),
  fontWeight: 500,
  lineHeight: 1.21,
  marginTop: theme.spacing(8),
  marginBottom: 0
}))

const Heading4 = styled('h4')(({ theme }) => ({
  ...theme.typography.h4,
  fontSize: theme.typography.pxToRem(24),
  lineHeight: 1.2,
  letterSpacing: '0.3px',
  marginTop: theme.spacing(4),
  marginBottom: 0
}))

const Heading5 = styled('h5')(({ theme }) => ({
  ...theme.typography.h5,
  fontSize: theme.typography.pxToRem(20),
  lineHeight: 1.2,
  letterSpacing: '0.3px',
  marginTop: theme.spacing(2),
  marginBottom: 0
}))

const Heading6 = styled(Heading5)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(18)
}))

const Blockquote = styled('blockquote')(({ theme }) => ({
  borderLeft: `4px solid`,
  borderColor: theme.palette.primary.main,
  paddingLeft: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  fontStyle: 'italic'
}))

const EmbeddedImage = styled('img')(({ theme }) => ({
  maxWidth: '100%',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const Hyperlink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.dark
  }
}))

const LinkedInEmbed = styled('iframe')(({ theme }) => ({
  height: 760,
  width: 560,
  border: `thin solid ${theme.palette.divider}`,
  padding: theme.spacing(0.625),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const TwitterContainer = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const YouTubeEmbed = styled('iframe')(({ theme }) => ({
  width: 560,
  height: 315,
  border: 0,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const ListItem = styled('li')(() => ({}))

const OrderedList = styled('ol')(({ theme }) => ({
  marginBottom: theme.spacing(2)
}))

const UnorderedList = styled('ul')(({ theme }) => ({
  marginBottom: theme.spacing(2)
}))

export {
  Blockquote,
  EmbeddedImage,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Hyperlink,
  LinkedInEmbed,
  ListItem,
  OrderedList,
  Paragraph,
  TwitterContainer,
  UnorderedList,
  YouTubeEmbed
}
