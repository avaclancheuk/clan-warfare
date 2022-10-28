export enum Status {
  NotStarted,
  Running,
  Calculating,
  Ended
}

export interface Clan {
  id: number
  name: string
  avatar: {
    fill: string
    background: {
      fill: string
      src: string
    }
    foreground: {
      fill: string
      src: string
    }
  }
  motto?: string
  description?: string
}
export interface Event {
  id: number
  startDate: string
  endDate: string
  name: string
  description: string
  status: keyof typeof Status
  modifiers?: Modifier[]
  stats?: any[]
  statsGamesThreshold?: number
}

export interface Member {
  id: number
  clanId: number
  name: string
  avatar: string
}

export interface Modifier {
  name: string
  shortName?: string
  description?: string
  createdBy?: string
  multiplierBonus?: number
  multiplierModifier?: boolean
  scoringBonus?: number
  scoringModifier?: boolean
}

export interface LeaderboardRow {
  rank: number
  score: number
  lastUpdated: string
}

export interface EventsLeaderboardRow
  extends Pick<Event, 'id' | 'name' | 'status'> {}

export interface EventLeaderboardRow
  extends Pick<Clan, 'id' | 'name' | 'avatar'>,
    LeaderboardRow {
  size: number
  active: number
}

export interface ClanLeaderboardRow
  extends Pick<Member, 'id' | 'name' | 'avatar'>,
    LeaderboardRow {
  overall: number
  games: number
  wins: number
}

export interface MemberLeaderboardRow extends LeaderboardRow {
  id: number
  name: string
}
