/**
 * blocks.ts
 *
 * 24블록 구조 관련 타입 정의
 */

import type { IdeaCandidate, IdeaState } from "./idea";
import type { ActsResult } from "./acts";

export type BlockIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;

export interface BlockSpec {
  index: BlockIndex;
  act: 1 | 2 | 3 | 4;
  title: string;
  purpose: string;
  required?: string;
  deliver?: string;
}

export type VariantSource = "initial" | "regenerate" | "expand";

export interface BlockOverviewVariant {
  id: string;
  createdAt: number;
  source: VariantSource;
  headline: string;
  hooks: string[];
  stakes?: string;
  tags?: string[];
  note?: string;
}

export type ExpandPreset = "more_specific" | "raise_stakes" | "add_emotion" | "add_twist" | "add_dialogue";

export interface BlockDetailVariant {
  id: string;
  createdAt: number;
  source: VariantSource;
  beat: string;
  microHooks?: string[];
  preset?: ExpandPreset;
}

export interface BlockNode {
  index: BlockIndex;
  overviewVariants: BlockOverviewVariant[];
  selectedOverviewId: string;
  detailVariants: BlockDetailVariant[];
  selectedDetailId?: string;
}

export interface BlocksMemory {
  protagonistGoal?: string;
  centralConflict?: string;
  bStory?: string;
  progressFlags: string[];
  lastHooks?: string[];
}

export interface BlocksDraft {
  specs: BlockSpec[];
  blocksByIndex: Record<number, BlockNode>;
  memory: BlocksMemory;
}

export interface GenerateBlocksOverviewInput {
  candidate: IdeaCandidate;
  state: IdeaState;
  acts?: ActsResult;
  mode?: "mock" | "server";
}

export interface GenerateBlockDetailInput {
  index: BlockIndex;
  spec: BlockSpec;
  overview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  preset?: ExpandPreset;
  sentenceRange?: { min: number; max: number };
  mode?: "mock" | "server";
}

export interface RegenerateOverviewInput {
  index: BlockIndex;
  spec: BlockSpec;
  currentOverview: BlockOverviewVariant;
  state: IdeaState;
  memory: BlocksMemory;
  mode?: "mock" | "server";
}

export interface ExpandOverviewInput {
  index: BlockIndex;
  spec: BlockSpec;
  currentOverview: BlockOverviewVariant;
  preset: ExpandPreset;
  state: IdeaState;
  memory: BlocksMemory;
  mode?: "mock" | "server";
}
