/**
 * ai.ts
 *
 * AI 관련 타입 정의
 */

/**
 * AI 사용량 메타데이터
 * - OpenAI API usage 정보를 저장
 * - 현재 mock 모드에서는 undefined이지만 실제 AI 호출 시 채워짐
 */
export interface UsageMeta {
  input_tokens?: number;
  output_tokens?: number;
  cached_tokens?: number;
  total_tokens?: number;
}
