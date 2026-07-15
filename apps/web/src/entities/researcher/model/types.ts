export type PersonalInfoItem = { key: string; value: string }

export type ExpertiseMajorItem = { type: string; name: string }

export type ExpertiseKeywordItem = { type: string; keyword: string }

export type ExpertiseTechItem = {
  group: string
  code: string
  name: string
  koKeyword: string
}

export type PaperItem = {
  no: number
  reg: string
  title: string
  journal: string
  journalType: string
  authors: number
  authorType: string
  date: string
  major: string
}

export type PatentItem = {
  no: number
  reg: string
  type: string
  name: string
  country: string
  appNo: string
  appDate: string
  applicant: string
  major: string
}

export type TaskItem = {
  period: string
  role: string
  name: string
  lead: string
  participating: string
  instType: string
  major: string
}

export type Researcher = {
  id: string
  personal: PersonalInfoItem[]
  expertiseMajor: ExpertiseMajorItem[]
  expertiseKeywords: ExpertiseKeywordItem[]
  expertiseTech: ExpertiseTechItem[]
  papers: PaperItem[]
  patents: PatentItem[]
  tasks: TaskItem[]
}
