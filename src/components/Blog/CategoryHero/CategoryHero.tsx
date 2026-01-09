import { memo } from 'react'
import { Typography } from 'decentraland-ui2'
import type { CategoryHeroProps } from './CategoryHero.types'
import { HeroContainer, HeroContent } from './CategoryHero.styled'

const CategoryHero = memo((props: CategoryHeroProps) => {
  const { category, description, image } = props
  return (
    <HeroContainer imageUrl={image}>
      <HeroContent>
        <Typography variant="h2" component="h1">
          {category}
        </Typography>
        <Typography variant="body1">{description}</Typography>
      </HeroContent>
    </HeroContainer>
  )
})

export { CategoryHero }
