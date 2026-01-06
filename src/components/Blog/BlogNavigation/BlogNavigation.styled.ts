import { Link } from 'react-router-dom'
import { Box, dclColors, styled } from 'decentraland-ui2'

const NavbarContainer = styled(Box)(() => ({
  width: '100%'
}))

const NavbarContent = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  height: '84px',
  position: 'relative',
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  display: 'flex',
  '@media (max-width: 1450px)': {
    height: 'auto'
  }
}))

const NavbarWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  margin: '0 auto',
  padding: `0 ${theme.spacing(3)}`,
  '@media (max-width: 1450px)': {
    flexDirection: 'column-reverse',
    alignItems: 'flex-start'
  }
}))

const NavbarCategories = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  overflowY: 'hidden',
  width: 'auto',

  '@media (max-width: 1450px)': {
    width: '100%',
    paddingBottom: theme.spacing(1)
  }
})).withComponent('nav')

const CategoryList = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  listStyleType: 'none',
  margin: 0,
  padding: 0,
  minWidth: '210px'
})).withComponent('ul')

const CategoryItem = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(4),
  whiteSpace: 'nowrap'
})).withComponent('li')

const CategoryLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$active'
})<{ $active: boolean }>(({ theme, $active }) => ({
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  fontSize: '17px',
  fontWeight: 400,
  height: '64px',
  padding: 0,
  position: 'relative',
  textDecoration: 'none',
  WebkitTapHighlightColor: 'transparent',

  '&::after': {
    content: '""',
    position: 'absolute',
    height: '1px',
    backgroundColor: dclColors.base.primary,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: $active ? 1 : 0,
    transition: 'opacity 250ms ease'
  },

  '&:hover::after': {
    opacity: 1
  }
}))

export { CategoryItem, CategoryLink, CategoryList, NavbarCategories, NavbarContainer, NavbarContent, NavbarWrapper }
