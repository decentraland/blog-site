import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetBlogCategoriesQuery } from '../../../features/blog/blog.client'
import { Search } from '../Search'
import type { BlogNavigationProps } from './BlogNavigation.types'
import {
  CategoryItem,
  CategoryLink,
  CategoryList,
  NavbarCategories,
  NavbarContainer,
  NavbarContent,
  NavbarWrapper
} from './BlogNavigation.styled'

const BlogNavigation = ({ active }: BlogNavigationProps) => {
  const location = useLocation()
  const { data: allCategories = [] } = useGetBlogCategoriesQuery()

  const categories = useMemo(() => {
    return allCategories.filter(category => category.isShownInMenu)
  }, [allCategories])

  const isActive = (path: string) => {
    if (active) {
      if (active === 'all_articles' && path === '/blog') {
        return true
      }
      return active === path
    }
    return location.pathname === path
  }

  return (
    <NavbarContainer>
      <NavbarContent>
        <NavbarWrapper>
          <NavbarCategories>
            <CategoryList>
              <CategoryItem>
                <CategoryLink to="/blog" $active={isActive('/blog') || active === 'all_articles'}>
                  All articles
                </CategoryLink>
              </CategoryItem>
              {categories.map(category => (
                <CategoryItem key={category.id}>
                  <CategoryLink to={`/blog/${category.slug}`} $active={isActive(`/blog/${category.slug}`)}>
                    {category.title}
                  </CategoryLink>
                </CategoryItem>
              ))}
            </CategoryList>
          </NavbarCategories>
          <Search />
        </NavbarWrapper>
      </NavbarContent>
    </NavbarContainer>
  )
}

export { BlogNavigation }
