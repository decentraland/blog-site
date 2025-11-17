import { Box, styled } from 'decentraland-ui2'

const HeroContainer = styled(Box)<{ imageUrl: string }>(({ theme, imageUrl }) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("${imageUrl}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  width: '100%',
  minHeight: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    minHeight: '300px'
  }
}))

const HeroContent = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  color: theme.palette.common.white,
  maxWidth: '800px',
  padding: theme.spacing(3),
  '& h1': {
    marginBottom: theme.spacing(2),
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
  },
  '& p': {
    fontSize: '18px',
    lineHeight: '28px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
  }
}))

export { HeroContainer, HeroContent }
