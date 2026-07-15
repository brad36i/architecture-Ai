export type ComparisonAttributeInput =
  | {
      label: string
      value: string
    }
  | Record<string, string>

export interface ComparisonResearch {
  id: string
  name: string
  isOurResearch?: boolean
  attributes: ComparisonAttributeInput[]
}

export interface DifferentiationReviewData {
  projectId: string
  relatedWorkComparison: {
    researches: ComparisonResearch[]
  }
  differentiationSummary: string[]
  improvementRecommendations: string[]
}
