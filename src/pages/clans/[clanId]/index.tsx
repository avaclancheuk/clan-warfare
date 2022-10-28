import React from 'react'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { BreadcrumbJsonLd } from 'next-seo'
import { possessive } from '@helpers/grammar'
import { canonicalUrl } from '@helpers/urls'
import PageContainer, { LoadingPageContainer } from '@components/PageContainer'
import Clan, { ClanMeta } from '@components/Clan'
import { getClan } from '@libs/api'

const ClanPage: React.FC = ({
  id,
  status,
  name,
  motto,
  description,
  avatar,
  leaderboard
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { isFallback } = useRouter()

  if (isFallback) return <LoadingPageContainer />

  const { kicker, url } = ClanMeta[status]
  const meta = {
    canonical: canonicalUrl(url(id)),
    title: [name, kicker].join(' | '),
    description: [possessive(name), description].join(' ')
  }

  return (
    <PageContainer meta={meta}>
      <BreadcrumbJsonLd
        itemListElements={[
          { position: 1, name: kicker, item: canonicalUrl(url()) },
          { position: 2, name, item: meta.canonical }
        ]}
      />
      <Clan
        id={id}
        status={status}
        name={name}
        motto={motto}
        description={description}
        avatar={avatar}
        leaderboard={leaderboard}
      />
    </PageContainer>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const status = params?.status || null
  const clanId = params?.clanId.toString()
  const clan = await getClan(parseInt(clanId))

  // TODO: Handle 404
  // if (!clan) {
  //   return { notFound: true }
  // }

  return {
    props: {
      ...clan,
      status
    },
    revalidate: 60
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  // TODO: Only load top clans
  const clans = []
  const paths = clans.map(clanId => ({
    params: { clanId }
  }))

  return { paths, fallback: true }
}

export default ClanPage
