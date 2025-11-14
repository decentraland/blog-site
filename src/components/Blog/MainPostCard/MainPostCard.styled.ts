import { Link } from 'react-router-dom'
import { Box, Skeleton, dclColors, styled } from 'decentraland-ui2'

const CardContainer = styled(Box)(() => ({
  width: '100%',
  margin: '0 40px 40px 0',
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-between',
  '@media (max-width: 1096px)': {
    display: 'none'
  }
}))

const CardImage = styled(Box)<{ $imageUrl: string }>(({ $imageUrl }) => ({
  backgroundImage: `url("${$imageUrl}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16)',
  borderRadius: '5px',
  width: '697px',
  paddingBottom: 'calc(697px * 0.5)',
  marginRight: '31px',
  transition: 'transform 250ms ease, box-shadow 250ms ease'
}))

const CardImageLink = styled(Link)(() => ({
  display: 'block',
  '&:hover > div': {
    transform: 'translate(0, -4px)',
    boxShadow: '0 10px 20px 0 rgba(0, 0, 0, 0.12)'
  }
}))

const CardInfo = styled(Box)({
  width: '335px'
})

const DateText = styled('span')(({ theme }) => ({
  marginRight: '16px',
  color: theme.palette.text.primary,
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  textTransform: 'uppercase',
  display: 'inline'
}))

const CategoryLink = styled(Link)(() => ({
  color: dclColors.neutral.gray3,
  fontSize: '13px',
  textDecoration: 'none',
  textTransform: 'uppercase',
  transition: 'color 250ms ease',
  fontWeight: 400,
  '&:hover': {
    color: dclColors.neutral.gray2
  }
}))

const TitleLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  display: 'block',
  color: theme.palette.text.primary,
  '& h2, & h3': {
    fontSize: '34px',
    lineHeight: '42px',
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  '&:visited, &:link, &:active': {
    color: theme.palette.text.primary
  },
  '& *': {
    color: theme.palette.text.primary
  }
}))

const Description = styled('p')(({ theme }) => ({
  display: 'block',
  fontSize: '17px',
  lineHeight: '26px',
  letterSpacing: '-0.4px',
  margin: 0,
  paddingTop: '8px',
  fontWeight: 400,
  color: theme.palette.text.primary
}))

const LoadingHeader = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between'
}))

const LoadingImage = styled(Skeleton)(() => ({
  width: '697px',
  height: '348px'
}))

const LoadingTitleLine = styled(Skeleton)(() => ({
  width: '100%',
  height: '40px'
}))

const LoadingTitleLineShort = styled(Skeleton)(() => ({
  width: '90%',
  height: '40px'
}))

const LoadingMetaSkeleton = styled(Skeleton)(() => ({
  width: '100px'
}))

const LoadingTextSkeleton = styled(Skeleton)(() => ({
  width: '100%'
}))

const LoadingTextSkeletonShort = styled(Skeleton)(() => ({
  width: '80%'
}))

const LoadingContentBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2)
}))

const MetaBox = styled(Box)(() => ({}))

export {
  CardContainer,
  CardImage,
  CardImageLink,
  CardInfo,
  CategoryLink,
  DateText,
  Description,
  LoadingContentBox,
  LoadingHeader,
  LoadingImage,
  LoadingMetaSkeleton,
  LoadingTextSkeleton,
  LoadingTextSkeletonShort,
  LoadingTitleLine,
  LoadingTitleLineShort,
  MetaBox,
  TitleLink
}
