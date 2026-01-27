import { Box, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '66px'
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(5, 0, 2, 0),
  maxWidth: theme.spacing(133),
  margin: '0 auto'
}))

export { ContentWrapper, PageContainer }
