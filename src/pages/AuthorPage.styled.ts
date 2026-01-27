import type { Theme } from '@mui/material'
import { Box, styled } from 'decentraland-ui2'

const AuthorHeaderBox = styled(Box)(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'left',
  gap: theme.spacing(4)
}))

const AuthorImage = styled('img')(() => ({
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  objectFit: 'cover'
}))

const CenteredBox = styled(Box)(({ theme }: { theme: Theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8)
}))

export { AuthorHeaderBox, AuthorImage, CenteredBox }
