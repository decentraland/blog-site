/* eslint-disable @typescript-eslint/naming-convention */
import { Box, Typography, styled } from 'decentraland-ui2'

const HeroContainer = styled(Box)<{ imageUrl: string }>(({ theme, imageUrl }) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("${imageUrl}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  width: '100%',
  height: '248px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    height: '180px',
    justifyContent: 'center'
  }
}))

const HeroContent = styled(Box)(({ theme }) => ({
  textAlign: 'left',
  color: theme.palette.common.white,
  maxWidth: theme.spacing(133),
  width: '100%',
  margin: '0 auto',
  padding: theme.spacing(3),
  '& p': {
    fontSize: '18px',
    lineHeight: '28px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
  },
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center'
  }
}))

const HeroTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  [theme.breakpoints.down('sm')]: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    lineHeight: theme.typography.h4.lineHeight
  }
}))

export { HeroContainer, HeroContent, HeroTitle }
