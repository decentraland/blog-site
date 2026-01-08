import { Box, Typography, styled } from 'decentraland-ui2'

const SearchSubtitle = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(4.5, 0, 3),
  ...theme.typography.h4,
  fontWeight: 400,
  padding: theme.spacing(0, 2),
  '& span': {
    fontWeight: 700
  }
}))

const HeaderBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}))

const CenteredBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4)
}))

const ResultsWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column'
}))

const LoadMoreContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(4)
}))

export { CenteredBox, HeaderBox, LoadMoreContainer, ResultsWrapper, SearchSubtitle }
