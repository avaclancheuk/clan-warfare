import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MasterLayout from './_master'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'

class ContentLayout extends Component {
  render () {
    const { children } = this.props

    return (
      <MasterLayout {...this.props}>
        <Header />
        {children()}
        <Footer />
      </MasterLayout>
    )
  }
}

ContentLayout.propTypes = {
  children: PropTypes.func
}

export default ContentLayout

export const pageQuery = graphql`
  query ContentLayoutQuery {
    site {
      siteMetadata {
        enableIdentity
        title
        description
      }
    }
  }
`
