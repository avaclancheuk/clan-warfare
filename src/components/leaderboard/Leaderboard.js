import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import Link from 'gatsby-link'
import classNames from 'classnames'
import MultiSort from 'multi-sort'
import Avatar from '../avatar/Avatar'
import Icon from '../icon/Icon'
import { ModifierList } from '../modifier/Modifier'
import { Medal } from '../medal/Medal'
import { TagList } from '../tag/Tag'
import ExternalSvg from '../../images/external.svg'

import './Leaderboard.styl'

const moment = require('moment')
const sentenceCase = require('sentence-case')
const constants = require('../../utils/constants')
const urlBuilder = require('../../utils/url-builder')

class Leaderboard extends Component {
  constructor (props) {
    super(props)

    this.state = {
      sorting: this.props.sorting
    }

    this.handleSort = this.handleSort.bind(this)
  }

  handleSort (e) {
    e.preventDefault()

    this.setState({
      sorting: e.target.dataset.sorting
    })
  }

  render () {
    var { data } = this.props
    const { columns, cutout, className } = this.props
    const { sorting } = this.state
    const baseClassName = 'leaderboard'

    if (!data || data.length <= 0) return null

    var keys = columns || Object.keys(data[0])
    const showIcons = (keys.indexOf('icon') !== -1 || keys.indexOf('foreground') !== -1 || keys.indexOf('background') !== -1)
    const showClanTag = keys.indexOf('clan') !== -1
    const showNames = keys.indexOf('name') !== -1
    const showNameTags = keys.indexOf('tags') !== -1
    const showGameDetails = keys.indexOf('game') !== -1
    const showModifiers = keys.indexOf('modifiers') !== -1
    const showMedals = keys.indexOf('medal') !== -1
    const showBonuses = keys.indexOf('bonuses') !== -1
    const filteredKeys = [
      'id',
      'icon',
      'color',
      'foreground',
      'background',
      'name',
      'clanId',
      'clan',
      'path',
      'game',
      'modifiers',
      'medal',
      'tags'
    ]
    const relativeDate = (date) => {
      return moment.utc(date).fromNow()
    }

    keys = keys.reduce((filtered, key) => {
      if (filteredKeys.indexOf(key) === -1) {
        filtered.push(key)
      }

      return filtered
    }, [])

    if (sorting) {
      data = MultiSort(data, sorting)
    }

    return (
      <div className={classNames(baseClassName, className, cutout && `${baseClassName}--cutout`)}>
        {data.map((item, i) => (
          <div key={i} className="leaderboard__row" data-result={showGameDetails && item.game.result}>
            {(showIcons || showNames) &&
              <div className="leaderboard__header">
                {showIcons &&
                  <Avatar className="leaderboard__icon" color={item.color} icon={item.icon} foreground={item.foreground} background={item.background} />
                }
                {showNames &&
                  <Fragment>
                    { showMedals &&
                      <Medal {...item.medal} size="small" align="left" className="leaderboard__medal" />
                    }
                    {item.path ? (
                      <Link to={item.path} className="leaderboard__name leaderboard__link">
                        {item.name}
                      </Link>
                    ) : (
                      <div className="leaderboard__name leaderboard__link">
                        {item.name}
                      </div>
                    )}
                    {showNameTags &&
                      <TagList tags={item.tags} className="leaderboard__tags" />
                    }
                    {showClanTag &&
                      <Link
                        to={urlBuilder.clanUrl(item.clanId.substring(constants.prefix.hash.length))}
                        className="leaderboard__clan-tag"
                        dangerouslySetInnerHTML={{ __html: item.clan.tag }}
                      />
                    }
                  </Fragment>
                }
              </div>
            }
            {(keys.length > 0 || showGameDetails) &&
              <div className="leaderboard__body">
                <div className="leaderboard__stats">
                  {showGameDetails &&
                    <div className="leaderboard__stat leaderboard__stat--game" data-suffix={`${item.game.map ? `${item.game.map}${item.game.mapSeparator}` : ''}${item.game.date ? relativeDate(item.game.date) : ''}`}>
                      {item.game.isExternal ? (
                        <a href={item.game.path} target="_blank" rel="noopener noreferrer">
                          <span>{item.game.type}</span>
                          <Icon className="leaderboard__external" a11yText="View permalink">
                            <ExternalSvg />
                          </Icon>
                        </a>
                      ) : (
                        <Link to={item.game.path} className="leaderboard__link">
                          {item.game.type}
                        </Link>
                      )}
                    </div>
                  }
                  {showModifiers &&
                    <div className="leaderboard__stat leaderboard__stat--modifiers">
                      <ModifierList size="small" align="right" modifiers={item.modifiers} />
                    </div>
                  }
                  {keys.map((key, i) => {
                    if (showBonuses && key === 'bonuses') {
                      return item.bonuses.map((bonus, i) => {
                        const bonusKey = bonus.shortName.toLowerCase()

                        if (keys.indexOf(bonusKey) !== -1) return null

                        return (
                          <div key={i} className={classNames('leaderboard__stat', `leaderboard__stat--${bonusKey}`)} data-prefix={sentenceCase(bonus.shortName)}>{bonus.count}</div>
                        )
                      })
                    }

                    const value = item[key] !== null ? `${item[key]}` : constants.blank

                    return (
                      <div key={i} className={classNames('leaderboard__stat', `leaderboard__stat--${key}`)} data-prefix={sentenceCase(key)}>{value}</div>
                    )
                  })}
                </div>
              </div>
            }
          </div>
        ))}
      </div>
    )
  }
}

Leaderboard.defaultProps = {
  descending: false,
  cutout: false
}

Leaderboard.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array,
  sorting: PropTypes.object,
  cutout: PropTypes.bool,
  className: PropTypes.string
}

export default Leaderboard

export const componentFragment = graphql`
  fragment leaderboardFragment on Event {
    leaderboards {
      large {
        path
        name
        color
        foreground {
          color
          icon
        }
        background {
          color
          icon
        }
        rank
        score
        active
        size
      }
      medium {
        path
        name
        color
        foreground {
          color
          icon
        }
        background {
          color
          icon
        }
        rank
        score
        active
        size
      }
      small {
        path
        name
        color
        foreground {
          color
          icon
        }
        background {
          color
          icon
        }
        rank
        score
        active
        size
      }
    }
  }
`
