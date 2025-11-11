export type Member = {
  id: number
  nickname: string
  profileImg?: string
}

export type Group = {
  id: number
  title: string
  recentDate: string
  tags: string[]
  members?: Member[]
}
