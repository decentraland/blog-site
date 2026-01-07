import { Box, styled } from 'decentraland-ui2'

const AuthorContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

const CategoryText = styled('span')(() => ({
  color: '#5c5c6e'
}))

const PreviewBanner = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  maxWidth: theme.spacing(96),
  margin: `0 auto ${theme.spacing(4)}`,
  [theme.breakpoints.down('xs')]: {
    margin: `0 ${theme.spacing(2)} ${theme.spacing(4)}`
  }
}))

export { AuthorContainer, CategoryText, PreviewBanner }
