export type Vote = string

export type Option = {
  key: string
  description: string
  color: string
}

export type Summary = {
  question: string
  max: number
  options: Map<string, Option>
  tally: Map<string, number>
}
