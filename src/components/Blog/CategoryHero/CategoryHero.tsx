import * as React from 'react'
import { Typography } from 'decentraland-ui2'
import type { CategoryHeroProps } from './CategoryHero.types'
import { HeroContainer, HeroContent } from './CategoryHero.styled'

const CategoryHero = React.memo((CategoryHeroProps: CategoryHeroProps) => {
  const { category, description, image } = CategoryHeroProps
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
