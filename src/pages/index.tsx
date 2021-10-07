import React, { useEffect, useState } from 'react'
import { GetStaticProps } from 'next'
import { useSession } from 'next-auth/client'
import { LogoJsonLd, SocialProfileJsonLd } from 'next-seo'
import urlJoin from 'url-join'
import { getUser } from '@libs/bungie'
import PageContainer, { PageContainerProps } from '@components/PageContainer'
import config from '@config'

const { logo, name, socialLinks, title, url } = config

const HomePage: React.FC<PageContainerProps> = ({ meta }) => {
  const [session] = useSession()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (session) {
      const fetchUser = async () => {
        setUser(await getUser(session.membershipId as string))
      }

      fetchUser()
    }
  }, [session])

  return (
    <PageContainer meta={meta}>
      <SocialProfileJsonLd
        type="Organization"
        name={name}
        url={url}
        sameAs={[socialLinks.twitter]}
      />
      {logo?.bitmap && (
        <LogoJsonLd url={url} logo={urlJoin(url, logo.bitmap)} />
      )}
      {user && (
        <>
          <p>Signed in as: {session.user.name}</p>
          <pre>{JSON.stringify(user, null, 1)}</pre>
        </>
      )}
    </PageContainer>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      meta: {
        canonical: urlJoin(url, '/'),
        customTitle: true,
        title
      }
    }
  }
}

export default HomePage
