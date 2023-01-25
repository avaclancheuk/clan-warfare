import { List, Tooltip } from '@newhighsco/chipset'
import classNames from 'classnames'
import React from 'react'

import Lockup from '~components/Lockup'
import { shortNumber } from '~helpers/stats'

import styles from './Stat.module.scss'

const BLANK = '-'

export interface StatProps {
  name: string
  value?: string | number
  label?: string
  className?: string
}

const Stat: React.FC<StatProps> = ({
  name,
  value = BLANK,
  label,
  className
}) => {
  // TODO: Add wrapping tooltip
  return (
    <div className={classNames(styles.root, className)}>
      <div className={styles.label}>{name}</div>
      <div className={styles.value}>{shortNumber(value)}</div>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  )
}

export interface StatListProps {
  stats: StatProps[]
  kicker?: string
  tooltip?: string
}

const StatList: React.FC<StatListProps> = ({ stats, kicker, tooltip }) => {
  if (!stats?.length) return null

  const lockup = (
    <Lockup
      kicker={[kicker, tooltip && '\u24D8'].filter(Boolean).join('')}
      border={false}
      align="center"
      className={styles.heading}
    />
  )

  return (
    <>
      {kicker &&
        (tooltip ? (
          <Tooltip
            toggle={lockup}
            manual={false}
            theme={{ content: styles.tooltip }}
          >
            {tooltip}
          </Tooltip>
        ) : (
          lockup
        ))}
      <List inline className={styles.list}>
        {stats.map((stat, i) => (
          <li key={i}>
            <Stat {...stat} />
          </li>
        ))}
      </List>
    </>
  )
}

export { Stat, StatList }
