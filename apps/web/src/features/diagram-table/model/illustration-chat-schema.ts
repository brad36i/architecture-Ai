import { z } from 'zod';

/** 스트림 요청 `max_critic_rounds` — 0~10, 기본 2 */
export const maxCriticRoundsSchema = z.coerce.number().int().min(0).max(10);

export const DEFAULT_MAX_CRITIC_ROUNDS = 2;

export function parseMaxCriticRoundsInput(raw: string): {
  success: true;
  value: number;
} | {
  success: false;
  error: string;
} {
  const trimmed = raw.trim();
  const toParse = trimmed === '' ? String(DEFAULT_MAX_CRITIC_ROUNDS) : trimmed;
  const result = maxCriticRoundsSchema.safeParse(toParse);
  if (!result.success) {
    return {
      success: false,
      error: '0~10 사이의 정수만 입력할 수 있습니다.',
    };
  }
  return { success: true, value: result.data };
}
