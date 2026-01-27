import { Box, styled } from 'decentraland-ui2'

const LoadMoreContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(6),
  display: 'flex',
  justifyContent: 'center'
}))

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(6)
}))

const ErrorContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4)
}))

export { ErrorContainer, LoadingContainer, LoadMoreContainer }
