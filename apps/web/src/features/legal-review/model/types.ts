export type LegalReviewProvider = 'openai' | 'fallback';

export type LegalReviewRecord = {
  id: number;
  projectId: string;
  stageStep: string;
  stageTitle: string;
  reviewFocus: string[];
  output: string;
  provider: LegalReviewProvider;
  reviewedAt: string;
};

export type LegalReviewResponse = {
  review: LegalReviewRecord | null;
};

export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  data: T | null;
  message?: string;
};
