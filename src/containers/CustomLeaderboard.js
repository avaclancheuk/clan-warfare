import React, { PureComponent } from 'react'
import { withRouteData } from 'react-static'
import PropTypes from 'prop-types'
import MultiSort from 'multi-sort'
import PageContainer from '../components/page-container/PageContainer'
import Card from '../components/card/Card'
import { Lockup } from '../components/lockup/Lockup'
import { Filter, getIds, filterById } from '../components/filter/Filter'
import Notification from '../components/notification/Notification'
import Leaderboard from '../components/leaderboard/Leaderboard'
import RelativeDate from '../components/relative-date/RelativeDate'

const constants = require('../utils/constants')
const urlBuilder = require('../utils/url-builder')

const columns = [
  'rank',
  'overall',
  'active',
  'size',
  'score'
]

const getVisible = (tags, leaderboard) => {
  const ids = getIds(tags)
  return tags.length > 0 ? leaderboard.filter(({ id }) => filterById(ids, id)) : []
}

const setHash = tags => {
  const ids = getIds(tags)
  const hash = `${ids.length ? constants.prefix.hash : ''}${ids.join(',')}`

  if (history.pushState) {
    history.pushState(null, null, `${window.location.pathname}${hash}`)
  } else {
    location.hash = hash
  }
}

class CustomLeaderboardContainer extends PureComponent {
  constructor (props) {
    super(props)

    const { history: { location: { hash } }, clans, events, currentEventId, previousEventId } = this.props
    const eventId = currentEventId || previousEventId
    const event = events.find(({ id }) => id === eventId)
    const ids = hash.replace(constants.prefix.hash, '').split(',')
    const totals = event.leaderboards.reduce((result, { leaderboard }) => result.concat(leaderboard), [])
    const meta = {
      kicker: currentEventId ? constants.kicker.current : constants.kicker.previous,
      kickerHref: event.path,
      title: 'Custom leaderboard',
      description: `Create and share custom leaderboards for the latest ${constants.meta.name} event`
    }
    var suggestions = []
    var tags = []
    var leaderboard = []

    const emptyTotal = {
      path: null,
      games: -1,
      overall: -1,
      active: currentEventId ? -1 : null,
      size: currentEventId ? -1 : null,
      score: -1,
      updated: null
    }

    clans.map(clan => {
      const clanId = clan.id
      const path = currentEventId ? urlBuilder.currentEventUrl(clanId) : urlBuilder.clanUrl(clanId, eventId)
      const suggestion = { id: clanId, name: clan.name }
      var total = totals.find(({ id }) => id === clanId)

      if (total) {
        total.games = 1
      } else {
        total = emptyTotal
      }

      total = {
        ...clan,
        ...total,
        path,
        tag: null,
        medal: null
      }

      suggestions.push(suggestion)
      leaderboard.push(total)

      if (filterById(ids, clanId)) tags.push(suggestion)
    })

    leaderboard = MultiSort(leaderboard, { score: 'DESC', name: 'ASC' })

    this.state = {
      active: false,
      meta,
      leaderboard,
      hasLeaderboard: leaderboard.length > 0,
      visible: leaderboard.filter(({ id }) => filterById(ids, id)),
      suggestions,
      tags
    }

    this.handleAddition = this.handleAddition.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount () {
    const { active } = this.state

    if (!active) this.setState({ active: true })
  }

  handleAddition (tag) {
    const { tags } = this.state
    const existing = tags.find(({ id }) => id === tag.id)

    if (!existing) {
      tags.push(tag)

      this.handleChange(tags)
    }
  }

  handleDelete (index) {
    const { tags } = this.state

    tags.splice(index, 1)

    this.handleChange(tags)
  }

  handleChange (tags) {
    const { leaderboard } = this.state
    const visible = getVisible(tags, leaderboard)

    this.setState({
      tags,
      visible
    }, () => setHash(tags))
  }

  render () {
    const { currentEventId } = this.props
    const { active, meta, hasLeaderboard, visible, tags, suggestions } = this.state
    const hasVisible = visible.length > 0

    return (
      <PageContainer meta={meta}>
        <Lockup primary center kicker={meta.kicker} kickerHref={meta.kickerHref}>
          {currentEventId &&
            <RelativeDate status />
          }
        </Lockup>
        <Card cutout={hasVisible} center>
          <Lockup center kicker="Custom" heading="leaderboard" />
          {active && hasLeaderboard &&
            <Filter
              kicker="Add clans"
              placeholder="Enter clan name"
              suggestions={suggestions}
              tags={tags}
              handleAddition={this.handleAddition}
              handleDelete={this.handleDelete}
            />
          }
          {!hasLeaderboard &&
            (currentEventId ? (
              <Notification>Leaderboards for this event are being calculated. Please check back later.</Notification>
            ) : (
              <Notification>Results for this event are being calculated. Please check back later.</Notification>
            ))
          }
        </Card>
        {hasVisible &&
          <Leaderboard cutout data={visible} columns={columns} />
        }
      </PageContainer>
    )
  }
}

CustomLeaderboardContainer.propTypes = {
  history: PropTypes.object,
  clans: PropTypes.array,
  events: PropTypes.array,
  currentEventId: PropTypes.number,
  previousEventId: PropTypes.number
}

export default withRouteData(CustomLeaderboardContainer)
