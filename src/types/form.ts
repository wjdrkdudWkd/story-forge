/**
 * form.ts
 *
 * 사용자 입력 폼의 상태를 정의합니다.
 * - 모든 옵션 필드는 optional (선택된 것만 payload로 전달)
 * - OptionGroup.id가 늘어나도 타입 수정을 최소화하는 구조
 */

import type { ToneKey } from "./options";

/**
 * 아이디어 생성 폼의 전체 상태
 *
 * 구조 설명:
 * 1. 고정 필드 (tone, realism, seed)
 * 2. 동적 옵션 필드 (world_*, character_*, plot_*)
 *    - OptionGroup.id를 key로 사용
 *    - 값은 선택된 Option.key
 * 3. 특수 필드 (motifs_ranked)
 *    - 우선순위가 있는 복수 선택
 *
 * 확장성:
 * - 새로운 OptionGroup이 추가되면 해당 id를 key로 추가
 * - [key: string]: unknown 패턴 대신 명시적 필드 사용
 */
export interface IdeaFormState {
  // === 고정 필드 ===
  /**
   * 전체 톤 (필수)
   */
  tone: ToneKey;

  /**
   * 리얼리즘 수준 (0~100)
   * - 0: 판타지/비현실적
   * - 100: 극사실주의
   */
  realism: number;

  /**
   * 랜덤 시드 (재현 가능성 보장)
   * - 미입력 시 자동 생성
   */
  seed?: number;

  // === 옵션 그룹 필드 (OptionGroup.id 기반) ===
  /**
   * 세계관 설정 (world_setting)
   * 선택된 Option.key
   */
  world_setting?: string;

  /**
   * 시대 배경 (world_era)
   */
  world_era?: string;

  /**
   * 공간 스케일 (world_scale)
   */
  world_scale?: string;

  /**
   * 주인공 유형 (character_protagonist)
   */
  character_protagonist?: string;

  /**
   * 주인공 수 (character_count)
   */
  character_count?: string;

  /**
   * 관계 구조 (character_relationship)
   */
  character_relationship?: string;

  /**
   * 플롯 구조 (plot_structure)
   */
  plot_structure?: string;

  /**
   * 갈등 유형 (plot_conflict)
   */
  plot_conflict?: string;

  /**
   * 엔딩 방향 (plot_ending)
   */
  plot_ending?: string;

  // === 특수 필드 ===
  /**
   * 모티프 우선순위 목록
   * - Option.key 배열 (순서 중요)
   * - 상위 3~5개만 선택
   */
  motifs_ranked?: string[];
}

/**
 * 폼 상태를 압축된 payload로 변환할 때의 타입
 *
 * 사용 예:
 * - AI에게 전달할 때 null/undefined 제거
 * - Supabase 저장 시 불필요한 필드 제거
 */
export type CompactedFormPayload = Partial<IdeaFormState>;
