import { Box, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '66px'
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  paddingBottom: theme.spacing(8)
}))

export { ContentWrapper, PageContainer }
