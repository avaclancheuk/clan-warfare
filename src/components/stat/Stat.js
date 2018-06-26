import React, { Fragment, PureComponent } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Tooltip from '../tooltip/Tooltip'
import { Lockup } from '../lockup/Lockup'
import styles from './Stat.styl'

const sentenceCase = require('sentence-case')
const constants = require('../../utils/constants')
const statsHelper = require('../../utils/stats-helper')
const sentence = require('../../utils/grammar').sentence
const baseClassName = 'stat'

class Stat extends PureComponent {
  render () {
    const { label, prefix, stat, size, className } = this.props
    var value = stat
    var valueLabel

    if (typeof value === 'object') {
      valueLabel = value.label
      value = typeof value.stat !== 'undefined' ? value.stat : constants.blank
    }

    value = isNaN(value) ? `${value}` : statsHelper.shortNumber(value)

    if (valueLabel && typeof valueLabel === 'string') valueLabel = [ valueLabel ]
    const enableHover = valueLabel && valueLabel.length > 1

    return (
      <Tooltip text={enableHover ? `<strong>Tied between:</strong> ${sentence(valueLabel)}` : null} className={className} valign="bottom" enableHover={enableHover}>
        <div className={classNames(
          styles[baseClassName],
          size && styles[`${baseClassName}--${size}`]
        )}>
          <div className={styles[`${baseClassName}__label`]}>
            {prefix &&
              <span>{prefix} </span>
            }
            {label}
          </div>
          <div className={styles[`${baseClassName}__value`]}>
            {value}
          </div>
          {valueLabel &&
            <div
              className={classNames(styles[`${baseClassName}__label`], styles[`${baseClassName}__label--simple`])}
              dangerouslySetInnerHTML={{ __html: sentence(valueLabel) }}
            />
          }
        </div>
      </Tooltip>
    )
  }
}

Stat.propTypes = {
  label: PropTypes.string,
  prefix: PropTypes.string,
  stat: PropTypes.oneOfType([ PropTypes.string, PropTypes.number, PropTypes.object ]),
  size: PropTypes.oneOf([ 'small' ]),
  className: PropTypes.string
}

class StatList extends PureComponent {
  render () {
    const { stats, kicker, top, size } = this.props

    if (!stats || stats.length < 1) return null

    // TODO: Move all these calculators out of render
    var keys = Object.keys(stats)
    var filteredKeys = [
      'id',
      'path',
      'lastPlayed',
      'updated'
    ]
    const kdaKeys = [
      'kills',
      'deaths',
      'assists'
    ]
    const kdKey = 'kd'
    const kdaKey = 'kda'
    const bonusesKey = 'bonuses'
    const ppgKeys = [
      'score',
      'games'
    ]
    const ppgKey = 'ppg'

    if (keys.filter(key => kdaKeys.indexOf(key) !== -1).length === kdaKeys.length) {
      const index = keys.indexOf(kdaKeys[0])

      keys.splice(index, kdaKeys.length, kdKey, kdaKey)
      stats[kdKey] = statsHelper.kd(stats)
      stats[kdaKey] = statsHelper.kda(stats)
    }

    if (keys.indexOf(ppgKey) === -1 && keys.filter(key => ppgKeys.indexOf(key) !== -1).length === ppgKeys.length) {
      const index = keys.indexOf(ppgKeys[0])

      keys.splice(index, 1, ppgKey, ppgKeys[0])
      stats[ppgKey] = statsHelper.ppg(stats)
    }

    const bonusesIndex = keys.indexOf(bonusesKey)

    if (bonusesIndex !== -1) {
      const bonusesKeys = stats[bonusesKey].map(bonus => {
        const key = bonus.shortName

        if (keys.indexOf(key.toLowerCase()) !== -1) return null
        stats[key] = bonus.count
        return key
      })

      keys.splice(bonusesIndex, 1, ...bonusesKeys)
    }

    keys = Array.from(new Set(keys)).reduce((filtered, key) => {
      if (filteredKeys.indexOf(key) === -1) {
        filtered.push(key)
      }

      return filtered
    }, [])

    return (
      <Fragment>
        {kicker &&
          <Lockup kicker={kicker} className={styles[`${baseClassName}-lockup`]} borderless />
        }
        <ul className={classNames('list--inline', styles[`${baseClassName}-list`])}>
          {keys.map((key, i) => {
            const label = sentenceCase(key)
            var stat = stats[key]
            var prefix

            if (stat === null) stat = constants.blank

            if (top) {
              prefix = constants.prefix.most

              if (key.match(/(kd|kda|ppg|score)/)) {
                prefix = constants.prefix.highest
              }
            }

            return (
              <li key={i}>
                <Stat label={label} stat={stat} prefix={prefix} size={size} />
              </li>
            )
          })}
        </ul>
      </Fragment>
    )
  }
}

StatList.propTypes = {
  stats: PropTypes.object,
  kicker: PropTypes.string,
  top: PropTypes.bool,
  size: PropTypes.oneOf([ 'small' ])
}

export {
  Stat,
  StatList
}
