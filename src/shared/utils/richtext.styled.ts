import { Box, styled } from 'decentraland-ui2'

const ListBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}))

const BlockquoteBox = styled(Box)(({ theme }) => ({
  borderLeft: `4px solid`,
  borderColor: theme.palette.primary.main,
  paddingLeft: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  fontStyle: 'italic'
}))

const EmbeddedImage = styled('img')(({ theme }) => ({
  maxWidth: '100%',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

export { BlockquoteBox, EmbeddedImage, ListBox }
