import { Box, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: '66px'
}))

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: `calc(96px + ${theme.spacing(5)}) 0 ${theme.spacing(2)} 0`,
  maxWidth: theme.spacing(133),
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: `calc(96px + ${theme.spacing(5)}) ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`
  }
}))

export { ContentWrapper, PageContainer }
