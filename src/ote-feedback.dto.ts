export enum OteFeedbackReason {
  ACCURATE = 'ACCURATE',
  OTE_TOO_LOW = 'OTE_TOO_LOW',
  OTE_TOO_HIGH = 'OTE_TOO_HIGH',
  BASE_TOO_LOW = 'BASE_TOO_LOW',
  BASE_TOO_HIGH = 'BASE_TOO_HIGH',
  COMMISSION_WRONG = 'COMMISSION_WRONG',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  EXPERIENCE_MISMATCH = 'EXPERIENCE_MISMATCH',
  ROLE_MISMATCH = 'ROLE_MISMATCH',
  OTHER = 'OTHER',
}

export interface CreateOteFeedbackRequestDto {
  expectedOteMin?: number | null;
  expectedOteMax?: number | null;
  reason: OteFeedbackReason;
  comment?: string | null;
}

export interface CreateOteFeedbackResponseDto {
  error: boolean;
  message: string;
  feedbackId: number;
}

export interface CurrentOteFeedbackStatusResponseDto {
  error: boolean;
  hasFeedbackForCurrentEstimate: boolean;
  feedbackId?: number;
  oteCalculatedAt?: string | null;
  feedbackSubmittedAt?: string | null;
}
