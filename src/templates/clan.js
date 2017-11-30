import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import PageContainer from '../components/page-container/PageContainer'
import Card from '../components/card/Card'
import Avatar from '../components/avatar/Avatar'
import Lockup from '../components/lockup/Lockup'
import Leaderboard from '../components/leaderboard/Leaderboard'
import { MedalList } from '../components/medal/Medal'
import Button from '../components/button/Button'

const moment = require('moment')
const constants = require('../utils/constants')

class ClanTemplate extends Component {
  render () {
    const { data } = this.props
    const leaderboard = data.allMember.edges.map(({ node }) => {
      const emptyDate = moment.utc(new Date(0)).format(constants.dateFormat)
      const lastPlayedDate = moment.utc(node.totals.lastPlayed).format(constants.dateFormat)

      return {
        path: node.path,
        name: node.name,
        icon: node.icon,
        tags: node.tags,
        ...node.totals,
        lastPlayed: lastPlayedDate > emptyDate ? lastPlayedDate : constants.blank
      }
    })

    return (
      <PageContainer>
        <Helmet>
          <title>{`${data.clan.name} | Clans`}</title>
        </Helmet>
        <Card cutout className="text-center">
          <Avatar className="card__avatar" color={data.clan.color} foreground={data.clan.foreground} background={data.clan.background} />
          <Lockup center reverse kicker={data.clan.motto} heading={data.clan.name} />
          <p key="description" dangerouslySetInnerHTML={{ __html: data.clan.description.replace(/(?:\r\n|\r|\n)/g, '<br />') }} />
          <Button key="button" href={`https://www.bungie.net/en/ClanV2?groupid=${data.clan.id}`} target="_blank">Join clan</Button>
          <MedalList key="medals" medals={[ { tier: 1, description: 'TBC', count: 2 }, { tier: 2, description: 'TBC', count: 5 }, { tier: 3, description: 'TBC', count: 1 } ]} />
        </Card>
        <Leaderboard cutout data={leaderboard} sortBy="score" descending />
      </PageContainer>
    )
  }
}

ClanTemplate.propTypes = {
  data: PropTypes.object
}

export default ClanTemplate

export const pageQuery = graphql`
  query ClanTemplateQuery($id: String!) {
    clan(id: { eq: $id }) {
      id
      name
      motto
      description
      color
      foreground {
        color
        icon
      }
      background {
        color
        icon
      }
    }
    allMember(filter: { clanId: { eq: $id } }, sort: { fields: [ nameSortable ] }) {
      edges {
        node {
          path
          name
          icon
          tags {
            name
          }
          totals {
            wins
            kills
            deaths
            assists
            score
            lastPlayed
          }
        }
      }
    }
  }
`
