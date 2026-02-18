import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const RelatedSection = styled('section')(({ theme }) => ({
  backgroundColor: dclColors.neutral.softBlack2,
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
  width: '100%',
  maxWidth: theme.spacing(136.875),
  margin: '0 auto'
}))

const RelatedTitle = styled(Typography)(({ theme }) => ({
  ...theme.typography.h6,
  color: theme.palette.text.primary
}))

const RelatedWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  gap: theme.spacing(4),
  [theme.breakpoints.down('xs')]: {
    justifyContent: 'center',
    flexWrap: 'wrap'
  }
}))

export { RelatedContainer, RelatedSection, RelatedTitle, RelatedWrapper }
