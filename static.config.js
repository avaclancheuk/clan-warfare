import ExtractCssChunks from 'extract-css-chunks-webpack-plugin'
import RSS from 'rss'
import Html from './src/Html'

require('dotenv').config()

const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')
const moment = require('moment')
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
  inlineCss: false,
  disableRouteInfoWarning: true,
  getRoutes: async () => {
    const { apiStatus, clans, events, members, modifiers, medals, currentEventId, currentLeaderboards, currentClanLeaderboard, matchHistory, matchHistoryLimit, previousEventId, previousClanLeaderboard, lastChecked, leaderboards, emptyTotals } = await dataSources.fetch()

    const routes = [
      {
        is404: true,
        component: 'src/containers/NotFound'
      },
      {
        path: '/branding/',
        component: 'src/containers/Branding',
        noindex: true
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

    const currentEventStats = {}
    const statsColumns = [
      'games',
      'wins',
      'kd',
      'kda',
      'bonuses',
      'ppg',
      'score'
    ]

    const addStat = (stats, column, value, name) => {
      if (name) {
        stats[column] = { stat: value, label: [ name ] }
      } else {
        stats[column] = value
      }
    }

    const incrementStat = (stats, column, value) => {
      var existingStat = stats[column]

      if (!existingStat) {
        addStat(stats, column, value)
      } else {
        stats[column] += value
      }
    }

    const updateStat = (stats, column, value, name) => {
      var existingStat = stats[column]

      if (!existingStat) {
        addStat(stats, column, value, name)
      } else {
        if (value === existingStat.stat) {
          existingStat.label.push(name)
        } else if (value > existingStat.stat) {
          addStat(stats, column, value, name)
        }
      }
    }

    const clanIds = []

    clans.map(clan => {
      const clanMembers = members.filter(({ clanId }) => clanId === clan.id)
      const clanCurrentTotals = {}
      const clanCurrentStats = {}
      const clanMatchHistory = {}
      const totalSize = clanMembers.length
      const platforms = []

      clanMembers.map(member => {
        const memberId = member.id
        const memberName = member.name
        const memberFullName = `${memberName} [${clan.tag}]`
        const hasPlayed = member.totals ? member.totals.games > 0 : false
        const platformId = member.platforms[0].id
        const existingPlatform = platforms.find(({ id }) => id === platformId)
        const memberLastChecked = lastChecked[memberId]

        if (existingPlatform) {
          if (hasPlayed) existingPlatform.active++
          existingPlatform.size++
          existingPlatform.percentage = Math.round((existingPlatform.size / totalSize) * 100)
        } else {
          platforms.push({ id: platformId, size: 1, active: hasPlayed ? 1 : 0, percentage: Math.round((1 / totalSize) * 100) })
        }

        if (currentEventId) {
          const currentTotals = currentClanLeaderboard[memberId]

          if (currentTotals) {
            const { games } = currentTotals
            const hasCurrentTotals = games > 0

            member.hasCurrentTotals = hasCurrentTotals

            if (hasCurrentTotals) {
              incrementStat(clanCurrentStats, 'totalActive', 1)
              incrementStat(currentEventStats, 'totalActive', 1)
              incrementStat(clanCurrentStats, 'totalGames', games)
              incrementStat(currentEventStats, 'totalGames', games)
            }

            clanCurrentTotals[memberId] = {
              ...currentTotals,
              updated: hasCurrentTotals ? memberLastChecked : null
            }

            if (games >= constants.statsGamesThreshold) {
              statsColumns.map(column => {
                if (column === 'bonuses' && currentTotals.bonuses) {
                  currentTotals.bonuses.map(({ shortName, count }) => {
                    updateStat(clanCurrentStats, shortName, count, memberName)
                    updateStat(currentEventStats, shortName, count, memberFullName)
                  })
                } else {
                  const value = currentTotals[column]

                  updateStat(clanCurrentStats, column, value, memberName)
                  updateStat(currentEventStats, column, value, memberFullName)
                }
              })
            }
          } else {
            clanCurrentTotals[memberId] = {
              ...emptyTotals,
              updated: null
            }
          }

          clanMatchHistory[memberId] = matchHistory[memberId] || []
        }

        if (previousEventId) {
          const previousTotals = previousClanLeaderboard[memberId]

          member.previousTotals = previousTotals || emptyTotals
        }
      })

      clan.platforms = platforms

      clanIds.push(clan.id)

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
            apiStatus,
            clan,
            members: clanMembers,
            currentTotals: clanCurrentTotals,
            currentStats: clanCurrentStats,
            matchHistory: clanMatchHistory,
            matchHistoryLimit
          })
        })
      }
    })

    const winnersMedal = medals.find(({ name }) => name.toUpperCase() === constants.result.winnersMedal.toUpperCase())
    var currentEventLeaderboards = []
    var currentEventSummary = []
    const currentEventSuggestions = []

    if (currentEventId) {
      currentEventLeaderboards = currentLeaderboards.map(({ leaderboard, division }, tabIndex) => {
        leaderboard = leaderboard.map(({ idStr, rank, totalScore, active, size }, i) => {
          const clan = clans.find(({ id }) => id === idStr)
          const { id, name, tag, avatar, platforms } = clan
          const clanLastChecked = lastChecked[id]

          currentEventSuggestions.push({
            id: `${tabIndex}${constants.blank}${i}`,
            name: `${name} [${tag}]`
          })

          return {
            path: urlBuilder.currentEventUrl(id),
            id,
            name,
            avatar,
            platforms,
            updated: clanLastChecked || null,
            rank: true,
            overall: statsHelper.ranking(rank),
            active,
            size,
            score: totalScore
          }
        })

        currentEventSummary.push({
          leaderboard: leaderboard.slice(0, 3),
          division
        })

        return {
          leaderboard,
          division
        }
      })
    }

    const suggestions = {}

    events.map(event => {
      const eventId = event.id
      const eventWinners = []
      const eventSuggestions = []
      const eventLeaderboards = leaderboards[eventId]

      event.modifiers = event.modifiers.map(id => {
        const modifier = modifiers.find(modifier => modifier.id === id)

        if (modifier.creatorId) {
          const member = members.find(({ id }) => id === modifier.creatorId)

          if (member) {
            const clan = clans.find(({ id }) => id === member.clanId)

            modifier.creator = `${member.name}${clan ? ` [${clan.tag}]` : ''}`
          }
        }

        const { name, description, creator, scoringModifier, bonus } = modifier

        return {
          name,
          description,
          creator,
          scoringModifier: scoringModifier || undefined,
          bonus
        }
      })

      if (eventLeaderboards) {
        leaderboards[eventId] = eventLeaderboards.map(({ leaderboard, division }, tabIndex) => {
          leaderboard = leaderboard.map(({ clanId, rank, score }, i) => {
            const clan = clans.find(({ id }) => id === `${clanId}`)
            const { path, id, name, tag, avatar, platforms } = clan
            var medal

            switch (i) {
              case 0:
                if (rank === 1) {
                  medal = {
                    tier: winnersMedal.tier,
                    name: winnersMedal.name,
                    description: winnersMedal.description
                  }
                } else {
                  medal = medalBuilder.build(1, 2, division.name)
                }

                if (eventId === previousEventId) {
                  eventWinners.push({
                    path,
                    id,
                    name,
                    avatar,
                    platforms,
                    medal,
                    division,
                    score
                  })
                }
                break
              case 1:
              case 2:
                medal = medalBuilder.build('top 3', 1, division.name)
                break
            }

            eventSuggestions.push({
              id: `${tabIndex}${constants.blank}${i}`,
              name: `${name} [${tag}]`
            })

            return {
              path,
              id,
              name,
              avatar,
              platforms,
              medal,
              rank: true,
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

      if (eventWinners.length) event.winners = eventWinners
      if (eventSuggestions.length) suggestions[eventId] = eventSuggestions

      routes.push({
        path: event.path,
        component: 'src/containers/Event',
        getData: () => ({
          event: { ...event, winners: undefined },
          leaderboards: event.isCurrent ? currentEventLeaderboards : leaderboards[eventId],
          suggestions: event.isCurrent ? currentEventSuggestions : suggestions[eventId],
          stats: event.isCurrent ? currentEventStats : undefined,
          apiStatus: event.isCurrent ? apiStatus : undefined
        })
      })
    })

    const currentEvent = events.find(({ id }) => id === currentEventId)
    const previousEvent = events.find(({ id }) => id === previousEventId)
    const nextEvent = events.filter(({ isFuture }) => isFuture).pop()
    const previousEventLeaderboards = previousEventId ? leaderboards[previousEventId] : undefined

    routes.push(
      {
        path: '/',
        component: 'src/containers/Home',
        getData: () => ({
          apiStatus,
          clanIds,
          currentEvent,
          previousEvent,
          nextEvent,
          currentEventSummary
        })
      },
      {
        path: urlBuilder.eventRootUrl,
        component: 'src/containers/Events',
        getData: () => ({
          events: events.map(({ path, name, startDate, endDate, isCurrent, isPast, modifiers }) => ({
            path,
            name,
            startDate,
            endDate,
            isCurrent,
            isPast,
            modifiers
          }))
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
          apiStatus,
          clans,
          event: currentEventId ? currentEvent : previousEvent,
          leaderboards: currentEventId ? currentEventLeaderboards : previousEventLeaderboards,
          currentEventId
        })
      },
      {
        path: '/pixelpub/',
        component: 'src/containers/CustomLeaderboard',
        noindex: true,
        getData: () => ({
          apiStatus,
          clans,
          selectedIds: constants.clans.pixelPub,
          event: currentEventId ? currentEvent : previousEvent,
          leaderboards: currentEventId ? currentEventLeaderboards : previousEventLeaderboards,
          currentEventId,
          meta: {
            title: 'PixelPub leaderboard',
            robots: 'noindex,nofollow',
            overall: false
          }
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

    await fs.ensureDir(distPath)
    await fs.writeFile(path.join(distPath, '/events.xml'), feed.xml())

    feed = new RSS(feedOptions)

    const kicker = `Enrollment ${apiStatus.enrollmentOpen ? 'is now open' : 'has closed'}`
    const hash = `${constants.prefix.hash}${constants.prefix.enroll}`
    const formattedDate = moment.utc().format(constants.format.url)
    const url = `${process.env.SITE_URL}/${apiStatus.enrollmentOpen ? 'open' : 'closed'}/${formattedDate}/`
    const canonicalUrl = apiStatus.enrollmentOpen ? ` ${process.env.SITE_URL}/${hash}` : ''
    const title = `${kicker} - ${formattedDate}`
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
    var { cssLoader, jsLoader, fileLoader } = defaultLoaders

    fileLoader.query.limit = 1

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
          cssLoader,
          jsLoader,
          fileLoader
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
