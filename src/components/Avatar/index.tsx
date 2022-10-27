import React from 'react'
import classNames from 'classnames'
import Image from 'next/image'
import { hexToRgb } from '@helpers/hex'
import { round } from '@helpers/stats'

import styles from './Avatar.module.scss'
import sizes from './_sizes.module.scss'

export enum AvatarSize {
  Small = 'small',
  Medium = 'medium'
}

interface AvatarLayerProps {
  id: string
  fill?: string
  src?: string
}

const AvatarLayer: React.FC<AvatarLayerProps> = ({ id, fill, src }) => {
  if (!fill || !src) return null

  const hex = hexToRgb(fill)
  const r = round(hex.r / 255, 3)
  const g = round(hex.g / 255, 3)
  const b = round(hex.b / 255, 3)

  return (
    <svg className={styles.layer} viewBox="0 0 1 1">
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feColorMatrix
          values={`${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`}
        />
      </filter>
      <image
        width="100%"
        height="100%"
        filter={`url(#${id})`}
        xlinkHref={src}
      />
    </svg>
  )
}

interface AvatarProps extends Pick<AvatarLayerProps, 'fill' | 'src'> {
  id?: number
  background?: Omit<AvatarLayerProps, 'id'>
  foreground?: Omit<AvatarLayerProps, 'id'>
  size?: AvatarSize
  outline?: boolean
  align?: AlignSetting
  className?: string
  children?: React.ReactNode
}

const Avatar: React.FC<AvatarProps> = ({
  src = 'https://www.bungie.net/img/profile/avatars/default_avatar.gif',
  fill,
  background,
  foreground,
  size,
  outline,
  align,
  id,
  className,
  children
}) => {
  const hasLayers = background?.src || foreground?.src

  return (
    <div
      className={classNames(
        styles.root,
        children && styles.inline,
        size && styles[size],
        outline && styles.outline,
        align && styles[align],
        className
      )}
      style={{ backgroundColor: fill }}
    >
      {hasLayers ? (
        <>
          {background && <AvatarLayer {...background} id={`${id}-bg`} />}
          {foreground && <AvatarLayer {...foreground} id={`${id}-fg`} />}
        </>
      ) : (
        children || <Image src={src} alt="" fill sizes={sizes.large} />
      )}
    </div>
  )
}

export default Avatar
