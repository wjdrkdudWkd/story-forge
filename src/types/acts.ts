/**
 * acts.ts
 *
 * 5막 구조(발단/전개/위기/절정/결말) 관련 타입 정의
 */

import type { IdeaState } from "./idea";

export type ActKey = "setup" | "progress" | "crisis" | "climax" | "resolution";

export interface Act {
  key: ActKey;
  title: string;
  summary: string;
}

export interface ActsResult {
  acts: Act[];
  state: IdeaState;
}

export interface GenerateActsInput {
  logline: string;
  synopsis: string;
  state: IdeaState;
  /** 선택된 밀도로부터 결정된 목표 막 수 (3, 4, 5) */
  actCount: number;
}
