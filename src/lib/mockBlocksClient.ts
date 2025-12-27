/**
 * mockBlocksClient.ts
 *
 * Mock 24블록 생성기 - 실제 AI 호출 없이 BlocksDraft 생성
 * Seed 기반으로 동일한 입력 → 동일한 결과 보장
 */

import type {
  GenerateBlocksOverviewInput,
  GenerateBlockDetailInput,
  RegenerateOverviewInput,
  ExpandOverviewInput,
  BlocksDraft,
  BlockNode,
  BlockOverviewVariant,
  BlockDetailVariant,
  BlocksMemory,
  ExpandPreset,
  BlockSpec,
} from "@/types/blocks";
import type { ToneKey } from "@/types/options";
import { seededRandom } from "./random";
import { BLOCK_SPECS } from "@/data/blockSpecs";

/**
 * Mock 24블록 개요 생성
 */
export function mockGenerateBlocksOverview(
  input: GenerateBlocksOverviewInput
): BlocksDraft {
  const { candidate, state, acts } = input;
  const seed = state.seed;
  const rng = seededRandom(seed);

  // Memory 초기화
  const memory: BlocksMemory = {
    protagonistGoal: extractGoalFromLogline(candidate.logline),
    centralConflict: extractConflictFromSynopsis(candidate.synopsis),
    bStory: acts ? "관계 성장" : undefined,
    progressFlags: [],
    lastHooks: [],
  };

  // 24개 블록 생성
  const blocksByIndex: Record<number, BlockNode> = {};

  for (let i = 0; i < BLOCK_SPECS.length; i++) {
    const spec = BLOCK_SPECS[i];
    const overview = generateInitialOverview(
      spec,
      candidate,
      state,
      memory,
      rng
    );

    blocksByIndex[spec.index] = {
      index: spec.index,
      overviewVariants: [overview],
      selectedOverviewId: overview.id,
      detailVariants: [],
    };

    // 마지막 hooks 업데이트
    memory.lastHooks = overview.hooks;
  }

  return {
    specs: BLOCK_SPECS,
    blocksByIndex,
    memory,
  };
}

/**
 * Mock 블록 상세 생성
 */
export function mockGenerateBlockDetail(
  input: GenerateBlockDetailInput
): BlockDetailVariant {
  const { index, spec, overview, state, memory, preset } = input;
  const rng = seededRandom(state.seed + index);

  const beat = generateBeat(spec, overview, state.tone, preset, rng);
  const microHooks = generateMicroHooks(overview.hooks, rng);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: preset ? "expand" : "initial",
    beat,
    microHooks,
    preset,
  };
}

/**
 * Mock 개요 재생성
 */
export function mockRegenerateOverview(
  input: RegenerateOverviewInput
): BlockOverviewVariant {
  const { index, spec, state, memory } = input;
  const rng = seededRandom(state.seed + index + Date.now());

  const headline = generateHeadline(spec, state.tone, memory, rng);
  const hooks = generateHooks(spec, state.tone, memory, rng);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: "regenerate",
    headline,
    hooks,
  };
}

/**
 * Mock 개요 발전시키기 (Preset)
 */
export function mockExpandOverview(
  input: ExpandOverviewInput
): BlockOverviewVariant {
  const { index, spec, currentOverview, preset, state, memory } = input;
  const rng = seededRandom(state.seed + index + Date.now());

  const headline = applyPresetToHeadline(
    currentOverview.headline,
    preset,
    state.tone,
    rng
  );
  const hooks = applyPresetToHooks(currentOverview.hooks, preset, rng);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: "expand",
    headline,
    hooks,
    note: getPresetDescription(preset),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateInitialOverview(
  spec: BlockSpec,
  candidate: any,
  state: any,
  memory: BlocksMemory,
  rng: () => number
): BlockOverviewVariant {
  const headline = generateHeadline(spec, state.tone, memory, rng);
  const hooks = generateHooks(spec, state.tone, memory, rng);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: "initial",
    headline,
    hooks,
  };
}

function generateHeadline(
  spec: BlockSpec,
  tone: ToneKey,
  memory: BlocksMemory,
  rng: () => number
): string {
  const templates = getHeadlineTemplates(spec, tone);
  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

function generateHooks(
  spec: BlockSpec,
  tone: ToneKey,
  memory: BlocksMemory,
  rng: () => number
): string[] {
  const hookCount = Math.floor(rng() * 2) + 1; // 1~2개
  const hooks: string[] = [];

  for (let i = 0; i < hookCount; i++) {
    hooks.push(generateSingleHook(spec, tone, rng));
  }

  return hooks;
}

function generateBeat(
  spec: BlockSpec,
  overview: BlockOverviewVariant,
  tone: ToneKey,
  preset: ExpandPreset | undefined,
  rng: () => number
): string {
  const baseTemplates = getBeatTemplates(spec, tone);
  const idx = Math.floor(rng() * baseTemplates.length);
  let beat = baseTemplates[idx];

  if (preset) {
    beat = applyPresetToBeat(beat, preset, tone, rng);
  }

  return beat;
}

function generateMicroHooks(hooks: string[], rng: () => number): string[] {
  return hooks.slice(0, Math.floor(rng() * 2) + 1);
}

// ============================================================================
// Template Generators
// ============================================================================

function getHeadlineTemplates(spec: BlockSpec, tone: ToneKey): string[] {
  const toneModifier = getToneModifier(tone);

  // Act별 템플릿
  if (spec.act === 1) {
    return [
      `${spec.title}: 주인공의 일상이 ${toneModifier.conflict} 사건으로 흔들린다.`,
      `${spec.title}: ${toneModifier.emotion} 분위기 속에서 새로운 변화의 조짐이 보인다.`,
      `${spec.title}: 평범했던 세계에 균열이 생기며 이야기가 시작된다.`,
    ];
  } else if (spec.act === 2) {
    return [
      `${spec.title}: 주인공이 ${toneModifier.conflict} 도전에 직면한다.`,
      `${spec.title}: 새로운 장애물이 나타나며 갈등이 심화된다.`,
      `${spec.title}: ${toneModifier.emotion} 상황 속에서 선택의 순간이 다가온다.`,
    ];
  } else if (spec.act === 3) {
    return [
      `${spec.title}: ${toneModifier.conflict} 위기가 최고조에 달한다.`,
      `${spec.title}: 모든 것이 무너질 듯한 순간, 주인공은 진실을 마주한다.`,
      `${spec.title}: 대립이 격화되며 돌이킬 수 없는 지점에 다다른다.`,
    ];
  } else {
    return [
      `${spec.title}: 최후의 대결이 ${toneModifier.ending} 펼쳐진다.`,
      `${spec.title}: 모든 갈등이 수렴하며 결말을 향해 나아간다.`,
      `${spec.title}: ${toneModifier.emotion} 여운과 함께 이야기가 마무리된다.`,
    ];
  }
}

function getBeatTemplates(spec: BlockSpec, tone: ToneKey): string[] {
  const toneModifier = getToneModifier(tone);

  return [
    `${spec.purpose} 주인공은 ${toneModifier.conflict} 상황에 놓인다. 주변 인물들과의 관계가 변화하며, 새로운 정보가 드러난다. 이 과정에서 ${toneModifier.emotion} 감정이 교차한다. 주인공의 선택이 다음 사건의 방향을 결정한다.`,
    `이 장면에서는 ${spec.purpose.toLowerCase()} ${toneModifier.emotion} 분위기가 지배적이며, 주인공은 내적 갈등을 겪는다. 외적 사건과 내적 변화가 동시에 일어나며, 이야기는 다음 단계로 전환된다.`,
    `${toneModifier.conflict} 사건이 벌어지며 ${spec.purpose.toLowerCase()} 주인공과 주변 인물들의 진짜 모습이 드러난다. 긴장감이 고조되고, 다음 블록으로 이어질 복선이 깔린다.`,
  ];
}

function generateSingleHook(
  spec: BlockSpec,
  tone: ToneKey,
  rng: () => number
): string {
  const templates = [
    "예상치 못한 인물이 등장한다",
    "숨겨진 진실의 일부가 드러난다",
    "새로운 갈등의 씨앗이 뿌려진다",
    "관계에 균열이 생긴다",
    "중요한 선택의 여파가 나타난다",
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

// ============================================================================
// Preset Application
// ============================================================================

function applyPresetToHeadline(
  headline: string,
  preset: ExpandPreset,
  tone: ToneKey,
  rng: () => number
): string {
  const modifiers: Record<ExpandPreset, string[]> = {
    more_specific: [
      "구체적인 장소와 시간이 명시되며, ",
      "세밀한 디테일이 추가되어, ",
    ],
    raise_stakes: ["위험이 배가되며, ", "시간 제약이 더해지며, "],
    add_emotion: ["강렬한 감정이 폭발하며, ", "내면의 갈등이 심화되며, "],
    add_twist: ["예상 밖의 반전이 일어나며, ", "숨겨진 진실이 뒤집히며, "],
    add_dialogue: ["중요한 대화가 오가며, ", "결정적 말이 던져지며, "],
  };

  const options = modifiers[preset];
  const idx = Math.floor(rng() * options.length);
  return options[idx] + headline.toLowerCase();
}

function applyPresetToHooks(
  hooks: string[],
  preset: ExpandPreset,
  rng: () => number
): string[] {
  return hooks.map((hook) => {
    if (preset === "more_specific") {
      return hook + " (구체적 정황 포함)";
    } else if (preset === "raise_stakes") {
      return hook + " (더 큰 위험 도래)";
    } else if (preset === "add_emotion") {
      return hook + " (감정적 충격 강화)";
    } else if (preset === "add_twist") {
      return hook + " (반전 요소 추가)";
    } else {
      return hook + " (대사 포함)";
    }
  });
}

function applyPresetToBeat(
  beat: string,
  preset: ExpandPreset,
  tone: ToneKey,
  rng: () => number
): string {
  const additions: Record<ExpandPreset, string[]> = {
    more_specific: [
      ' 구체적으로, 낡은 벽돌 건물 3층 창가에서 이 대화가 벌어진다. 시간은 오후 4시 32분, 햇빛이 비스듬히 들어온다.',
      ' 정확한 장소는 도심 외곽의 버려진 공장 지대. 녹슨 철문과 깨진 유리창이 분위기를 만든다.',
    ],
    raise_stakes: [
      ' 하지만 시간은 48시간밖에 남지 않았다. 실패하면 모든 것을 잃게 된다.',
      ' 그리고 이 선택의 대가는 생각보다 훨씬 크다. 돌이킬 수 없는 결과가 기다린다.',
    ],
    add_emotion: [
      ' 주인공의 손이 떨린다. 분노와 두려움, 그리고 희망이 뒤섞인 복잡한 감정이 밀려온다.',
      ' 가슴 깊은 곳에서 올라오는 감정을 억누를 수 없다. 눈물이 맺히지만, 참아낸다.',
    ],
    add_twist: [
      ' 그런데 그 순간, 예상치 못한 사실이 드러난다. 믿었던 정보가 거짓이었다.',
      ' 하지만 상황이 뒤집힌다. 적이라고 생각했던 인물이 사실은 아군이었다.',
    ],
    add_dialogue: [
      ' "이제 더 이상 도망칠 곳은 없어." 낮고 단호한 목소리가 울린다.',
      ' "정말 이게 최선이라고 생각해?" 주인공이 묻는다. 대답은 없다.',
    ],
  };

  const options = additions[preset];
  const idx = Math.floor(rng() * options.length);
  return beat + options[idx];
}

function getPresetDescription(preset: ExpandPreset): string {
  const descriptions: Record<ExpandPreset, string> = {
    more_specific: "구체적 묘사 강화",
    raise_stakes: "위험도 상승",
    add_emotion: "감정 표현 추가",
    add_twist: "반전 요소 추가",
    add_dialogue: "대사 추가",
  };
  return descriptions[preset];
}

// ============================================================================
// Tone Modifiers
// ============================================================================

function getToneModifier(tone: ToneKey): {
  conflict: string;
  emotion: string;
  ending: string;
} {
  switch (tone) {
    case "light":
      return {
        conflict: "가벼운",
        emotion: "희망적인",
        ending: "긍정적으로",
      };
    case "hard":
      return {
        conflict: "무거운",
        emotion: "진지한",
        ending: "성찰하며",
      };
    case "bleak":
      return {
        conflict: "암울한",
        emotion: "비극적인",
        ending: "쓸쓸하게",
      };
  }
}

// ============================================================================
// Memory Helpers
// ============================================================================

function extractGoalFromLogline(logline: string): string {
  return "목표를 달성하기 위한 여정";
}

function extractConflictFromSynopsis(synopsis: string): string {
  return "핵심 갈등과 대립 구도";
}
