import { Box, styled } from 'decentraland-ui2'

const PostListWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  paddingTop: theme.spacing(5),
  paddingBottom: theme.spacing(2.5),
  '& > div:nth-of-type(3n)': {
    marginRight: theme.spacing(4)
  },
  '& > div:nth-of-type(3n + 1)': {
    marginRight: 0
  },
  '@media (max-width: 1096px)': {
    justifyContent: 'space-between',
    '& > div, & > div:nth-of-type(3n)': {
      marginRight: 0
    }
  }
}))

const PostListContainer = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  marginTop: 0
}))

export { PostListContainer, PostListWrapper }
