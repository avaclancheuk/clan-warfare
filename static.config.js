import ExtractCssChunks from 'extract-css-chunks-webpack-plugin'
import RSS from 'rss'
import Html from './src/Html'

require('dotenv').config()

const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')
const dataSources = require('./src/lib/data-sources')
const stylusLoaders = require('./src/utils/stylus-loaders')
const constants = require('./src/utils/constants')
const medalBuilder = require('./src/utils/medal-builder')
const urlBuilder = require('./src/utils/url-builder')
const feedBuilder = require('./src/utils/feed-builder')
const statsHelper = require('./src/utils/stats-helper')

const distPath = 'public'
const redirects = []

export default {
  paths: {
    dist: distPath,
    devDist: distPath,
    public: 'static'
  },
  devServer: {
    port: 9000
  },
  siteRoot: process.env.SITE_URL,
  bundleAnalyzer: false,
  extractCssChunks: true,
  inlineCss: true,
  disableRouteInfoWarning: true,
  getRoutes: async () => {
    const { apiStatus, clans, events, members, modifiers, medals, currentEventId, currentEventLeaderboards, currentClanLeaderboard, matchHistory, previousEventId, previousClanLeaderboard } = await dataSources.fetch()

    await fs.writeFile(path.join(distPath, 'api-status.json'), JSON.stringify(apiStatus))

    const routes = [
      {
        is404: true,
        component: 'src/containers/NotFound'
      },
      {
        path: '/branding/',
        component: 'src/containers/Branding'
      },
      {
        path: '/faqs/',
        component: 'src/containers/FrequentlyAskedQuestions'
      },
      {
        path: '/support-us/',
        component: 'src/containers/SupportUs'
      },
      {
        path: '/thanks/',
        component: 'src/containers/Thanks'
      }
    ]

    clans.map(clan => {
      const clanMembers = members.filter(({ clanId }) => clanId === clan.id)
      const totalSize = clanMembers.length
      const platforms = []
      var clanLastChecked = null

      clanMembers.map(member => {
        const memberId = member.id
        const hasPlayed = member.totals ? member.totals.games > 0 : false
        const platformId = member.platforms[0].id
        const existing = platforms.find(({ id }) => id === platformId)
        const lastChecked = member.lastChecked

        if (!clanLastChecked || lastChecked > clanLastChecked) clanLastChecked = lastChecked

        if (existing) {
          if (hasPlayed) existing.active++
          existing.size++
          existing.percentage = Math.round((existing.size / totalSize) * 100)
        } else {
          platforms.push({ id: platformId, size: 1, active: hasPlayed ? 1 : 0, percentage: Math.round((1 / totalSize) * 100) })
        }

        if (currentEventId) {
          const currentTotals = currentClanLeaderboard.find(({ id }) => id === memberId)

          member.currentTotals = {
            ...currentTotals,
            updated: currentTotals.games > 0 ? lastChecked : null
          }

          member.matchHistory = matchHistory[memberId] || []
        }

        if (previousEventId) {
          const previousTotals = previousClanLeaderboard.find(({ id }) => id === memberId)
          const pastEvents = []

          if (previousTotals && previousTotals.games > 0) {
            const { eventId, path, ...totals } = previousTotals
            const event = events.find(({ id }) => id === eventId)

            pastEvents.push({
              ...totals,
              id: eventId,
              game: {
                path: event.path,
                result: true,
                name: event.name,
                endDate: event.endDate
              }
            })
          }

          member.previousTotals = previousTotals
          member.pastEvents = pastEvents
        }

        redirects.push({ from: `${urlBuilder.profileRootUrl}${memberId}/`, to: member.path, code: 301 })
      })

      clan.platforms = platforms
      clan.lastChecked = clanLastChecked

      routes.push({
        path: clan.path,
        component: 'src/containers/clan/Overall',
        getData: () => ({
          clan,
          members: clanMembers,
          currentEventId,
          previousEventId
        })
      })

      if (currentEventId) {
        routes.push({
          path: urlBuilder.currentEventUrl(clan.id),
          component: 'src/containers/clan/Current',
          getData: () => ({
            clan,
            members: clanMembers
          })
        })
      }
    })

    const winnersMedal = medals.find(({ name }) => name.toUpperCase() === constants.result.winnersMedal.toUpperCase())

    events.map(event => {
      event.results = []
      event.modifiers = event.modifiers.map(id => {
        const modifier = modifiers.find(modifier => modifier.id === id)
        const member = members.find(({ id }) => id === modifier.creator)

        if (member) {
          const clan = clans.find(({ id }) => id === member.clanId)

          modifier.creator = `${member.name}${clan ? ` [${clan.tag}]` : ''}`
        }

        return modifier
      })

      if (event.isCurrent) {
        event.leaderboards = currentEventLeaderboards.map(({ leaderboard, division }) => {
          leaderboard = leaderboard.map(({ Id, Rank, TotalScore, Active, Size }, i) => {
            const clan = clans.find(({ id }) => id === `${Id}`)

            return {
              ...clan,
              tag: null,
              path: urlBuilder.currentEventUrl(clan.id),
              updated: clan.lastChecked,
              overall: statsHelper.ranking(Rank),
              active: Active,
              size: Size,
              score: TotalScore
            }
          })

          return {
            leaderboard,
            division
          }
        })
      } else {
        event.leaderboards = event.leaderboards.map(({ leaderboard, division }) => {
          leaderboard = leaderboard.map(({ clanId, rank, score }, i) => {
            const clan = clans.find(({ id }) => id === `${clanId}`)
            var medal

            switch (i) {
              case 0:
                if (rank === 1) {
                  medal = winnersMedal
                } else {
                  medal = medalBuilder.build(1, 2, division.name)
                }

                event.results.push({
                  ...clan,
                  tag: null,
                  medal,
                  division,
                  score
                })
                break
              case 1:
              case 2:
                medal = medalBuilder.build('top 3', 1, division.name)
                break
            }

            return {
              ...clan,
              tag: null,
              medal,
              overall: statsHelper.ranking(rank),
              score
            }
          })

          return {
            leaderboard,
            division
          }
        })
      }

      routes.push({
        path: event.path,
        component: 'src/containers/Event',
        getData: () => ({
          event
        })
      })
    })

    routes.push(
      {
        path: '/',
        component: 'src/containers/Home',
        getData: () => ({
          clans,
          events,
          currentEventId,
          previousEventId
        })
      },
      {
        path: urlBuilder.eventRootUrl,
        component: 'src/containers/Events',
        getData: () => ({
          events
        })
      },
      {
        path: urlBuilder.clanRootUrl,
        component: 'src/containers/Clans',
        getData: () => ({
          clans
        })
      },
      {
        path: urlBuilder.leaderboardRootUrl,
        component: 'src/containers/CustomLeaderboard',
        getData: () => ({
          clans,
          events,
          currentEventId,
          previousEventId
        })
      }
    )

    if (currentEventId) {
      redirects.push(
        { from: urlBuilder.eventUrl(currentEventId), to: urlBuilder.currentEventRootUrl, code: 302 },
        { from: `${urlBuilder.currentEventUrl(':clan')}*`, to: urlBuilder.currentEventUrl(':clan'), code: 200 }
      )
    } else {
      redirects.push({ from: `${urlBuilder.currentEventRootUrl}*`, to: '/#next', code: 302 })
    }

    const feedOptions = {
      title: constants.meta.title,
      description: constants.meta.description,
      site_url: process.env.SITE_URL
    }
    var feed = new RSS(feedOptions)

    feedBuilder(events).map(event => feed.item(event))

    await fs.writeFile(path.join(distPath, '/events.xml'), feed.xml())

    feed = new RSS(feedOptions)

    feedBuilder(events, constants.kicker.current).map(event => feed.item(event))

    await fs.writeFile(path.join(distPath, '/events--current.xml'), feed.xml())

    feed = new RSS(feedOptions)

    const kicker = `Enrollment ${apiStatus.enrollmentOpen ? 'is now open' : 'has closed'}`
    const hash = `${constants.prefix.hash}${constants.prefix.enroll}`
    const url = `${process.env.SITE_URL}/${apiStatus.enrollmentOpen ? 'open' : 'closed'}/${apiStatus.formattedDate}/`
    const canonicalUrl = apiStatus.enrollmentOpen ? ` ${process.env.SITE_URL}/${hash}` : ''
    const title = `${kicker} - ${apiStatus.formattedDate}`
    const content = `${kicker}${canonicalUrl}`

    feed.item({
      title: title,
      description: title,
      url,
      guid: url,
      date: apiStatus.updatedDate,
      custom_elements: [ { 'content:encoded': content } ]
    })

    await fs.writeFile(path.join(distPath, '/enrollment.xml'), feed.xml())

    return routes
  },
  webpack: (config, { defaultLoaders, stage }) => {
    if (stage !== 'dev') config.devtool = false

    config.entry = stage === 'dev'
      ? [ require.resolve('babel-polyfill'), ...config.entry ]
      : [ require.resolve('babel-polyfill'), config.entry ]

    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.styl$/,
            use: stage === 'dev'
              ? [ require.resolve('style-loader'), ...stylusLoaders() ]
              : ExtractCssChunks.extract({ use: stylusLoaders() })
          },
          {
            test: /\.svg$/,
            loader: require.resolve('svg-react-loader')
          },
          defaultLoaders.cssLoader,
          defaultLoaders.jsLoader,
          defaultLoaders.fileLoader
        ]
      }
    ]

    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
    if (stage === 'node') config.plugins.push(new ExtractCssChunks())

    return config
  },
  Document: Html,
  onBuild: async () => {
    const robots = [ 'User-agent: *' ]
    const disallowRobots = JSON.parse(process.env.DISALLOW_ROBOTS)

    if (disallowRobots) robots.push('Disallow: /')
    robots.push(`Sitemap: ${process.env.SITE_URL}/sitemap.xml`)

    await fs.writeFile(path.join(distPath, 'robots.txt'), robots.join('\n'))

    redirects.push(
      { from: urlBuilder.profileRootUrl, to: '/', code: 301 },
      { from: `${urlBuilder.clanUrl(':clan')}*`, to: urlBuilder.clanUrl(':clan'), code: 200 },
      { from: urlBuilder.eventUrl(':event/:clan'), to: urlBuilder.clanUrl(':clan', ':event'), code: 301 },
      { from: urlBuilder.eventUrl(':event/:clan/:member'), to: urlBuilder.profileUrl(':clan', ':member', ':event'), code: 301 }
    )

    await fs.writeFile(path.join(distPath, '_redirects'), redirects.map(redirect => `${redirect.from} ${redirect.to} ${redirect.code}`).join('\n'))

    const manifest = {
      name: constants.meta.name,
      short_name: constants.meta.shortName,
      start_url: `/`,
      background_color: constants.meta.themeColor,
      theme_color: constants.meta.themeColor,
      display: `minimal-ui`,
      icons: [
        {
          src: `/favicon-192x192.png`,
          sizes: `192x192`,
          type: `image/png`
        },
        {
          src: `/favicon-512x512.png`,
          sizes: `512x512`,
          type: `image/png`
        }
      ]
    }

    await fs.writeFile(path.join(distPath, 'manifest.webmanifest'), JSON.stringify(manifest))
  }
}
