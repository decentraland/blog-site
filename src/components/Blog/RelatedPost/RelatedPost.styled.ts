import { Box, Typography, styled } from 'decentraland-ui2'

const RelatedSection = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  paddingBottom: theme.spacing(13),
  paddingTop: theme.spacing(12),
  width: '100%'
}))

const RelatedContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  width: '100%'
}))

const RelatedTitle = styled(Typography)(({ theme }) => ({
  ...theme.typography.h6,
  color: theme.palette.text.primary
}))

const RelatedWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  [theme.breakpoints.down('xs')]: {
    justifyContent: 'center'
  }
}))

export { RelatedContainer, RelatedSection, RelatedTitle, RelatedWrapper }
