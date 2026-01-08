import { Box, Skeleton, Typography, styled } from 'decentraland-ui2'

const CardContainer = styled(Box)(({ theme }) => ({
  margin: theme.spacing(0, 0, 2),
  listStyleType: 'none',
  flexGrow: 1,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: 'transparent',
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  transition: 'transform 250ms ease, box-shadow 250ms ease',
  boxShadow: theme.shadows[1],
  height: '150px',
  '& > a': {
    display: 'flex',
    width: '100%',
    height: '100%',
    textDecoration: 'none'
  },
  '&:hover': {
    transform: 'translate(0, -4px)',
    boxShadow: theme.shadows[2]
  },
  [theme.breakpoints.down('sm')]: {
    height: '100px'
  }
}))

const CardContentBox = styled(Box)(() => ({
  display: 'flex',
  width: '100%',
  height: '100%'
}))

const CardImage = styled('img')(({ theme }) => ({
  flexShrink: 0,
  width: '232px',
  height: '100%',
  objectFit: 'cover',
  borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
  [theme.breakpoints.down('sm')]: {
    width: '33%'
  }
}))

const CardTextBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.75, 2.5, 3, 2.5),
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  overflow: 'hidden',
  '& em': {
    fontStyle: 'normal',
    fontWeight: 700,
    color: theme.palette.primary.main
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.75)
  }
}))

const CardTitle = styled(Typography)(({ theme }) => ({
  margin: `0 0 ${theme.spacing(0.5)}`,
  fontSize: theme.typography.pxToRem(20),
  lineHeight: '28px',
  fontWeight: 500,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  [theme.breakpoints.down('sm')]: {
    fontSize: theme.typography.pxToRem(15),
    lineHeight: '18px'
  }
}))

const CardDescription = styled(Typography)(({ theme }) => ({
  lineHeight: '24px',
  padding: 0,
  margin: 0,
  fontSize: theme.typography.pxToRem(15),
  color: theme.palette.text.secondary,
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const LoadingImage = styled(Skeleton)(({ theme }) => ({
  width: '232px',
  height: '100%',
  borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    width: '33%'
  }
}))

const LoadingTitle = styled(Skeleton)(({ theme }) => ({
  width: '80%',
  height: theme.spacing(3.5),
  marginBottom: theme.spacing(1)
}))

const LoadingDescription = styled(Skeleton)(({ theme }) => ({
  width: '100%',
  height: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const LoadingDescriptionShort = styled(Skeleton)(({ theme }) => ({
  width: '60%',
  height: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

export {
  CardContainer,
  CardContentBox,
  CardDescription,
  CardImage,
  CardTextBox,
  CardTitle,
  LoadingDescription,
  LoadingDescriptionShort,
  LoadingImage,
  LoadingTitle
}
