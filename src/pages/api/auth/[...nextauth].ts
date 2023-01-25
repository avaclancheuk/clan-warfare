import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

import { signInUrl, signOutUrl } from '~helpers/urls'
import { getMemberClans } from '~libs/bungie'

export default NextAuth({
  providers: [
    Providers.Bungie({
      clientId: process.env.BUNGIE_CLIENT_ID,
      clientSecret: process.env.BUNGIE_CLIENT_SECRET,
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    signingKey: process.env.NEXTAUTH_JWT_SIGNING_KEY
  },
  callbacks: {
    jwt: async (token, user, account) => {
      if (account) {
        try {
          const clans = await getMemberClans(account.id)

          token.clans = clans.results.map(
            ({
              group: { groupId, name },
              member: {
                destinyUserInfo: { membershipId }
              }
            }) => ({
              groupId,
              membershipId,
              name
            })
          )
        } catch {
          token.clans = []
        }
      }

      return await Promise.resolve(token)
    },
    session: async (session, token) => {
      const userSession = session
      userSession.user.membershipId = token.sub as string
      userSession.user.clans = token.clans as any

      return await Promise.resolve(userSession)
    }
  },
  pages: {
    signIn: signInUrl,
    signOut: signOutUrl,
    // error: 'TODO: create page',
    verifyRequest: null,
    newUser: null
  }
})
