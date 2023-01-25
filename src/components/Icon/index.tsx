import { Icon as ThemedIcon } from '@newhighsco/chipset'
import type PropTypes from 'prop-types'
import React from 'react'

import useSvg from '~hooks/useSvg'

interface IconProps extends PropTypes.InferProps<ThemedIcon.propTypes> {
  name: string
}

const Icon: React.FC<IconProps> = ({ name, ...rest }) => {
  const [loading, Svg] = useSvg(name)

  if (loading || !Svg) {
    return null
  }

  return (
    <ThemedIcon {...rest}>
      <Svg />
    </ThemedIcon>
  )
}

export default Icon
