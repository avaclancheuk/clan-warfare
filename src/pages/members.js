import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import PageContainer from '../components/page-container/PageContainer'
import Lockup from '../components/lockup/Lockup'
import Leaderboard from '../components/leaderboard/Leaderboard'

class MembersPage extends Component {
  render () {
    const { data } = this.props
    const leaderboard = data.allMember.edges.map(edge => edge.node)

    return (
      <PageContainer>
        <Helmet>
          <title>Members</title>
        </Helmet>
        <Lockup kicker="Beta site" heading="Members" />
        <div className="temp">
          <p>Search for members</p>
        </div>
        <Leaderboard data={leaderboard} columns={[ 'icon', 'name', 'clan' ]} />
      </PageContainer>
    )
  }
}

MembersPage.propTypes = {
  data: PropTypes.object
}

export default MembersPage

export const data = {
  layout: 'content'
}

export const pageQuery = graphql`
  query MembersPageQuery {
    allMember(sort: { fields: [ clanSortable, nameSortable ] }) {
      edges {
        node {
          id
          path
          name
          icon
          clanId
          clan {
            tag
          }
        }
      }
    }
  }
`
