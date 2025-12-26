/**
 * idea.ts
 *
 * AI 생성 아이디어의 입력/출력 계약을 정의합니다.
 *
 * 흐름:
 * IdeaFormState → (compact) → GenerateIdeaInput → AI → IdeaResult
 * IdeaResult.state → 다음 단계 (5막/24블록) 입력
 */

import type { ToneKey } from "./options";
import type { IdeaFormState, CompactedFormPayload } from "./form";

/**
 * AI가 생성한 아이디어 후보 (1개)
 *
 * @property logline - 한 줄 요약 (핵심 훅)
 * @property synopsis - 2~3문단 시놉시스
 * @property tags - 자동 생성된 장르/분위기 태그
 */
export interface IdeaCandidate {
  logline: string;
  synopsis: string;
  tags: string[];
}

/**
 * 다음 단계로 전달되는 최소 상태
 *
 * - 텍스트 전체가 아니라 "결정된 사실"만 담습니다.
 * - 5막 구조 / 24블록 생성 시 이 상태를 기반으로 작업합니다.
 * - Supabase에 JSON 컬럼으로 저장 가능한 구조입니다.
 */
export interface IdeaState {
  /**
   * 랜덤 시드 (재현 가능성 보장)
   */
  seed: number;

  /**
   * 톤 (필수)
   */
  tone: ToneKey;

  /**
   * 리얼리즘 수준 (0~100)
   */
  realism?: number;

  /**
   * 세계관 관련 결정사항
   * - key: OptionGroup.id (world_setting, world_era 등)
   * - value: 선택된 Option.key
   */
  world?: Record<string, string>;

  /**
   * 캐릭터 관련 결정사항
   * - key: OptionGroup.id (character_protagonist 등)
   * - value: 선택된 Option.key
   */
  character?: Record<string, string>;

  /**
   * 플롯 관련 결정사항
   * - key: OptionGroup.id (plot_structure 등)
   * - value: 선택된 Option.key
   */
  plot?: Record<string, string>;

  /**
   * 우선순위 모티프 목록
   * - Option.key 배열
   */
  motifsRanked?: string[];
}

/**
 * AI 생성 결과
 *
 * @property candidates - 생성된 아이디어 후보들 (보통 3개)
 * @property state - 다음 단계로 전달할 최소 상태
 */
export interface IdeaResult {
  candidates: IdeaCandidate[];
  state: IdeaState;
}

/**
 * AI 생성 요청 입력
 *
 * @property form - 원본 폼 상태 (참고용)
 * @property compactedPayload - 실제 AI에 전달될 압축된 데이터
 * @property mode - 실행 모드 (mock: 로컬 테스트, server: 실제 AI 호출)
 */
export interface GenerateIdeaInput {
  /**
   * 원본 폼 상태 (로깅/디버깅용)
   */
  form: IdeaFormState;

  /**
   * AI에 전달될 압축된 payload
   * - null/undefined 제거됨
   * - 선택된 필드만 포함
   */
  compactedPayload: CompactedFormPayload;

  /**
   * 실행 모드
   * - mock: 하드코딩된 샘플 데이터 반환
   * - server: 실제 AI API 호출 (기본값)
   */
  mode?: "mock" | "server";
}
