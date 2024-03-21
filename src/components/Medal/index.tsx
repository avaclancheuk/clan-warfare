import { List, ResponsiveMedia, Tooltip } from '@newhighsco/chipset'
import { kebabCase } from 'change-case'
import classNames from 'classnames'
import type PropTypes from 'prop-types'
import React from 'react'

import Icon from '~components/Icon'
import Lockup from '~components/Lockup'

import { duplicates } from './foregrounds'
import styles from './Medal.module.scss'

export enum MedalTiers {
  Primary = 3,
  Secondary = 2,
  Tertiary = 1
}

export interface MedalProps {
  name: string
  description: string
  tier: MedalTiers
  count?: number
  awardedTo?: [string?]
  tooltipProps?: PropTypes.InferProps<Tooltip.propTypes>
}

const Medal: React.FC<MedalProps> = ({
  name,
  description,
  tier = MedalTiers.Tertiary,
  count = 1,
  awardedTo,
  tooltipProps
}) => {
  const key = kebabCase(name || '')
  const icon: string = duplicates[key] || key
  const label = new Intl.ListFormat().format(awardedTo)

  return (
    <Tooltip
      toggle={
        <div
          className={classNames(styles.root, styles[MedalTiers[tier]])}
          data-icon={name}
        >
          <ResponsiveMedia ratio="124:129" className={styles.layers}>
            <Icon
              name={`medal/background/tier${tier}`}
              theme={{ root: classNames(styles.background, styles.layer) }}
            />
            {icon && (
              <Icon
                name={`medal/foreground/${icon}`}
                theme={{ root: classNames(styles.foreground, styles.layer) }}
              />
            )}
            <Icon
              name="medal/highlight"
              theme={{ root: classNames(styles.highlight, styles.layer) }}
            />
            {count > 1 && (
              <div className={classNames(styles.foreground, styles.count)}>
                <span className={styles.background}>{count}</span>
              </div>
            )}
          </ResponsiveMedia>
          {label && (
            <div
              className={styles.label}
              dangerouslySetInnerHTML={{ __html: label }}
            />
          )}
        </div>
      }
      heading={name}
      {...tooltipProps}
    >
      {description}
    </Tooltip>
  )
}

export interface MedalListProps {
  medals: MedalProps[]
  kicker?: string
  tooltipProps?: MedalProps['tooltipProps']
}

const MedalList: React.FC<MedalListProps> = ({
  medals,
  kicker,
  tooltipProps
}) => {
  if (!medals?.length) return null

  return (
    <>
      <Lockup
        kicker={kicker}
        border={false}
        align="center"
        className={styles.heading}
      />
      <List inline className={styles.list}>
        {medals
          .sort((a, b) => b.tier - a.tier)
          .map((medal, i) => (
            <li key={i}>
              <Medal {...medal} tooltipProps={tooltipProps} />
            </li>
          ))}
      </List>
    </>
  )
}

export { Medal, MedalList }
