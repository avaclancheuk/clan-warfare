import urlJoin from 'url-join'
import config from '@config'

export const CURRENT_TENSE = 'Current'

const { url: siteUrl } = config

const join = (...paths: any[]): string =>
  urlJoin(paths.filter(Boolean).map(path => `${path as string}`))

export const apiUrl = (path?: string): string =>
  join('https://newhighscoredcw.blob.core.windows.net/dcw', `${path}.json`)

export const canonicalUrl = (path?: string): string => join(siteUrl, path)

export const clanUrl = (
  clanId?: number | string,
  membershipId?: number | string
): string => join('/clans', clanId, membershipId)

export const currentUrl = (
  clanId?: number | string,
  membershipId?: number | string
): string => join('/current', clanId, membershipId)

export const eventUrl = (tense?: string, id?: number | string): string => {
  if (tense === CURRENT_TENSE) return currentUrl()

  return join('/events', id)
}

export const userUrl = (path?: string): string => join('/user', path)

export const signInUrl = userUrl('signin')

export const signOutUrl = userUrl('signout')
