import logoBitmap from '~images/logo-avatar.png'
import logoVector from '~images/logo-avatar.svg'
import openGraphImage from '~images/sharing.png'
import colors from '~styles/_colors.module.scss'

const config = {
  url: process.env.NEXT_PUBLIC_SITE_URL,
  name: 'Destiny Clan Warfare',
  shortName: 'Clan Warfare',
  title: 'Destiny Clan Warfare - Band together, Guardians',
  description:
    'Wage war against other clans in Destiny 2 and battle your way to the top of the Destiny 2 clan leaderboard',
  logo: {
    bitmap: logoBitmap.src,
    vector: logoVector
  },
  openGraphImage: openGraphImage.src,
  themeColor: colors.eclipse,
  twitterHandle: 'destinyclanwar',
  socialLinks: {
    twitter: 'https://twitter.com/destinyclanwar'
  }
}

export default config
