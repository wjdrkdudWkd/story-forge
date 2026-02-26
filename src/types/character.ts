/**
 * character.ts
 *
 * 캐릭터 페르소나 상태 타입 정의
 *
 * 흐름: character_setting 단계에서 사용자가 설정
 *       → generateActs / generateBlocks 요청 시 state에 포함
 */

// ─────────────────────────────────────────────
// 캐릭터 역할 유형
// ─────────────────────────────────────────────
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporter' | 'other';

// ─────────────────────────────────────────────
// AI 추천 항목 (핵심 결함 / 욕망)
// ─────────────────────────────────────────────
export interface CharacterTrait {
  id: string;
  /** 핵심 결함 (Flaw): 캐릭터가 극복해야 할 내면의 약점 */
  flaw: string;
  /** 욕망 (Desire): 캐릭터가 진정으로 원하는 것 */
  desire: string;
  /** UI 표시용 간단한 라벨 */
  label: string;
}

// ─────────────────────────────────────────────
// 단일 캐릭터 프로필
// ─────────────────────────────────────────────
export interface CharacterProfile {
  id: string;
  role: CharacterRole;
  /** 캐릭터 이름 */
  name: string;
  /** 나이 (선택) */
  age?: string;
  /** 한 줄 성격 묘사 */
  description: string;
  /** 선택된 핵심 결함 */
  selectedFlaw: string;
  /** 선택된 욕망 */
  selectedDesire: string;
}

// ─────────────────────────────────────────────
// 전체 캐릭터 상태 (전역)
// ─────────────────────────────────────────────
export interface CharacterState {
  /** 주요 등장인물 목록 */
  characters: CharacterProfile[];
}

// ─────────────────────────────────────────────
// AI 캐릭터 제안 요청/응답
// ─────────────────────────────────────────────
export interface GetCharacterSuggestionsInput {
  logline: string;
  mode?: 'mock' | 'server';
}

export interface CharacterSuggestion {
  role: CharacterRole;
  /** AI가 제안한 기본 이름 */
  defaultName: string;
  /** AI가 제안한 기본 한 줄 묘사 */
  defaultDescription: string;
  /** 추천 핵심결함/욕망 조합 3가지 */
  traits: CharacterTrait[];
}

export interface GetCharacterSuggestionsResult {
  suggestions: CharacterSuggestion[];
}
