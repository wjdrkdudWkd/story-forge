/**
 * options.ts
 *
 * 옵션 시스템의 기본 계약을 정의합니다.
 * - UI는 OptionGroup.id를 기준으로 자동 렌더됩니다.
 * - 필드명을 하드코딩하지 않고 확장 가능하게 설계되었습니다.
 */

/**
 * 개별 선택지
 *
 * @property key - 내부 식별자 (영문, snake_case/camelCase)
 * @property label - UI 표시용 텍스트 (한글 가능)
 * @property tags - AI 힌트용 태그 배열 (선택)
 * @property weight - 랜덤 선택 시 가중치 (기본값: 1)
 */
export interface Option {
  key: string;
  label: string;
  tags?: string[];
  weight?: number;
}

/**
 * 옵션 그룹 (UI 섹션 단위)
 *
 * @property id - 필드 식별자 (form 데이터의 key로 사용됨)
 * @property label - UI 섹션 제목
 * @property options - 이 그룹에 속한 선택지 목록
 *
 * 예시: { id: "world_setting", label: "세계관", options: [...] }
 * → form["world_setting"] = "selected_key"
 */
export interface OptionGroup {
  id: string;
  label: string;
  options: Option[];
}

/**
 * 톤 타입
 *
 * - light: 밝고 희망적
 * - hard: 무겁고 진지함
 * - bleak: 암울하고 절망적
 */
export type ToneKey = "light" | "hard" | "bleak";
