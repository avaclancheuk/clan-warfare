import React from 'react'
import classNames from 'classnames'
import Link from 'next/link'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { SmartLink } from '@newhighsco/chipset'
import Avatar, { AvatarSize } from '@components/Avatar'
import { rankNumber, shortNumber } from '@helpers/stats'
import { currentUrl } from '@helpers/urls'
import { ClanLeaderboardRow, EventLeaderboardRow } from '@libs/api/types'

import styles from './Leaderboard.module.scss'
import RelativeDate from '@components/RelativeDate'

interface LeaderProps {
  rows?: EventLeaderboardRow[] | ClanLeaderboardRow[]
}

const Leaderboard: React.FC<LeaderProps> = ({ rows }) => {
  if (!rows || rows.length < 1) return null

  return (
    <AutoSizer disableHeight defaultWidth={300}>
      {({ width }) => (
        <List height={500} itemCount={rows.length} itemSize={75} width={width}>
          {({ index, style }) => {
            const { id, avatar, name, lastUpdated, rank, score } = rows[index]
            const avatarProps =
              typeof avatar === 'string' ? { src: avatar } : avatar

            return (
              <div
                style={style}
                className={classNames(
                  styles.row,
                  index % 2 === 0 && styles.even
                )}
              >
                <Avatar size={AvatarSize.Medium} id={id} {...avatarProps} />
                <div className={classNames(styles.cell, styles.heading)}>
                  <Link href={currentUrl(id)} passHref prefetch={false}>
                    <SmartLink className={styles.link}>{name}</SmartLink>
                  </Link>
                  <RelativeDate
                    date={lastUpdated}
                    label="Updated"
                    className={styles.date}
                  />
                </div>
                <div className={styles.cell} data-label="Rank">
                  {rankNumber(rank)}
                </div>
                <div className={styles.cell} data-label="Score">
                  {shortNumber(score)}
                </div>
              </div>
            )
          }}
        </List>
      )}
    </AutoSizer>
  )
}

export default Leaderboard
