import { Box, styled } from 'decentraland-ui2'

const STANDALONE_NAVBAR_HEIGHT = '66px'

const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: STANDALONE_NAVBAR_HEIGHT
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(5, 0, 2, 0),
  maxWidth: theme.spacing(133),
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 2, 2, 2)
  }
}))

export { ContentWrapper, PageContainer }
