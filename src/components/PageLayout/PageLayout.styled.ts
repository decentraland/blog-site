import { Box, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '66px'
}))

const ContentWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== '$embedded'
})<{ $embedded?: boolean }>(({ theme, $embedded }) => ({
  flex: 1,
  padding: $embedded ? `calc(96px + ${theme.spacing(5)}) 0 ${theme.spacing(2)} 0` : theme.spacing(5, 0, 2, 0),
  maxWidth: theme.spacing(133),
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: $embedded
      ? `calc(96px + ${theme.spacing(5)}) ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`
      : theme.spacing(5, 2, 2, 2)
  }
}))

export { ContentWrapper, PageContainer }
