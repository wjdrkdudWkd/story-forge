/**
 * mockAiClient.ts
 *
 * Mock AI 생성기 - 실제 AI 호출 없이 IdeaResult 생성
 * Seed 기반으로 동일한 입력 → 동일한 결과 보장
 */

import type { GenerateIdeaInput, IdeaResult, IdeaState } from "@/types/idea";
import type { IdeaFormState } from "@/types/form";
import { seededRandom, shuffle } from "./random";
import {
  ALL_OPTION_GROUPS,
  WORLD_OPTIONS,
  CHARACTER_OPTIONS,
  PLOT_OPTIONS,
  MOTIF_OPTIONS,
} from "@/data/options";

/**
 * Mock AI 아이디어 생성
 */
export function mockGenerateIdea(input: GenerateIdeaInput): IdeaResult {
  const { form, compactedPayload } = input;
  const seed = form.seed ?? Date.now();
  const rng = seededRandom(seed);

  // IdeaState 구성 (다음 단계로 전달될 최소 상태)
  const state = buildIdeaState(form, seed);

  // 태그 생성 (선택된 옵션 기반)
  const tags = buildTags(form);

  // 템플릿 변수 준비
  const vars = buildTemplateVars(form, rng);

  // 후보 2개 생성
  const candidates = [
    {
      logline: generateLogline("goal", vars, rng),
      synopsis: generateSynopsis("goal", vars, form.tone, rng),
      tags: shuffle(tags, rng).slice(0, 8),
    },
    {
      logline: generateLogline("relationship", vars, rng),
      synopsis: generateSynopsis("relationship", vars, form.tone, rng),
      tags: shuffle(tags, rng).slice(0, 8),
    },
  ];

  return { candidates, state };
}

/**
 * IdeaState 구성
 */
function buildIdeaState(form: IdeaFormState, seed: number): IdeaState {
  const state: IdeaState = {
    seed,
    tone: form.tone,
  };

  if (form.realism !== undefined) {
    state.realism = form.realism;
  }

  // World 필드 수집
  const world: Record<string, string> = {};
  WORLD_OPTIONS.forEach((group) => {
    const value = form[group.id as keyof IdeaFormState];
    if (value && typeof value === "string") {
      world[group.id] = value;
    }
  });
  if (Object.keys(world).length > 0) {
    state.world = world;
  }

  // Character 필드 수집
  const character: Record<string, string> = {};
  CHARACTER_OPTIONS.forEach((group) => {
    const value = form[group.id as keyof IdeaFormState];
    if (value && typeof value === "string") {
      character[group.id] = value;
    }
  });
  if (Object.keys(character).length > 0) {
    state.character = character;
  }

  // Plot 필드 수집
  const plot: Record<string, string> = {};
  PLOT_OPTIONS.forEach((group) => {
    const value = form[group.id as keyof IdeaFormState];
    if (value && typeof value === "string") {
      plot[group.id] = value;
    }
  });
  if (Object.keys(plot).length > 0) {
    state.plot = plot;
  }

  // Motifs
  if (form.motifs_ranked && form.motifs_ranked.length > 0) {
    state.motifsRanked = form.motifs_ranked;
  }

  return state;
}

/**
 * 태그 생성
 */
function buildTags(form: IdeaFormState): string[] {
  const tags: string[] = [form.tone];

  ALL_OPTION_GROUPS.forEach((group) => {
    const selectedKey = form[group.id as keyof IdeaFormState];
    if (selectedKey && typeof selectedKey === "string") {
      const option = group.options.find((opt) => opt.key === selectedKey);
      if (option) {
        tags.push(option.label);
        if (option.tags) {
          tags.push(...option.tags);
        }
      }
    }
  });

  if (form.motifs_ranked) {
    form.motifs_ranked.slice(0, 3).forEach((key) => {
      const motif = MOTIF_OPTIONS.options.find((opt) => opt.key === key);
      if (motif) {
        tags.push(motif.label);
      }
    });
  }

  return [...new Set(tags)];
}

/**
 * 템플릿 변수 준비
 */
interface TemplateVars {
  worldSetting: string;
  protagonist: string;
  conflict: string;
  motif: string;
  scale: string;
  relationship: string;
}

function buildTemplateVars(
  form: IdeaFormState,
  rng: () => number
): TemplateVars {
  const getLabel = (groupId: string, fallback: string) => {
    const value = form[groupId as keyof IdeaFormState];
    if (!value || typeof value !== "string") return fallback;
    const group = ALL_OPTION_GROUPS.find((g) => g.id === groupId);
    const option = group?.options.find((opt) => opt.key === value);
    return option?.label ?? fallback;
  };

  const getMotif = () => {
    if (!form.motifs_ranked || form.motifs_ranked.length === 0) {
      return "정체성";
    }
    const key = form.motifs_ranked[0];
    const motif = MOTIF_OPTIONS.options.find((opt) => opt.key === key);
    return motif?.label ?? "정체성";
  };

  return {
    worldSetting: getLabel("world_setting", "현대"),
    protagonist: getLabel("character_protagonist", "평범한 사람"),
    conflict: getLabel("plot_conflict", "인간 vs 자아"),
    motif: getMotif(),
    scale: getLabel("world_scale", "도시"),
    relationship: getLabel("character_relationship", "낯선 이들"),
  };
}

/**
 * 로그라인 생성
 */
function generateLogline(
  focus: "goal" | "relationship",
  vars: TemplateVars,
  rng: () => number
): string {
  const templates = {
    goal: [
      `${vars.worldSetting} 세계에서 ${vars.protagonist}는 ${vars.motif}를 위해 ${vars.conflict}에 맞서 싸운다.`,
      `${vars.scale} 규모의 ${vars.worldSetting} 배경 속, ${vars.protagonist}의 ${vars.motif} 추구가 예상치 못한 ${vars.conflict}를 불러일으킨다.`,
      `${vars.protagonist}가 ${vars.worldSetting}에서 ${vars.motif}의 진실을 마주하는 순간, ${vars.conflict}이 모든 것을 뒤흔든다.`,
    ],
    relationship: [
      `${vars.relationship} 관계로 시작된 ${vars.protagonist}들은 ${vars.worldSetting}에서 ${vars.motif}를 둘러싼 ${vars.conflict}에 휘말린다.`,
      `${vars.worldSetting}의 ${vars.scale}에서, ${vars.relationship}였던 이들이 ${vars.motif}를 둘러싼 비밀로 인해 ${vars.conflict}에 직면한다.`,
      `${vars.protagonist}와 ${vars.relationship} 사이의 갈등이 ${vars.worldSetting}을 배경으로 ${vars.motif}의 진정한 의미를 시험한다.`,
    ],
  };

  const pool = templates[focus];
  const index = Math.floor(rng() * pool.length);
  return pool[index];
}

/**
 * 시놉시스 생성
 */
function generateSynopsis(
  focus: "goal" | "relationship",
  vars: TemplateVars,
  tone: string,
  rng: () => number
): string {
  const sentences: string[] = [];

  // 1. 시작 상태
  sentences.push(
    `${vars.worldSetting} 세계에서 ${vars.protagonist}는 평범한 일상을 살아간다.`
  );

  // 2. 사건의 발단
  if (focus === "goal") {
    sentences.push(
      `어느 날, ${vars.motif}와 관련된 예기치 못한 사건이 그의 삶을 뒤흔든다.`
    );
  } else {
    sentences.push(
      `${vars.relationship}였던 이들과의 만남이 ${vars.motif}를 둘러싼 비밀을 드러낸다.`
    );
  }

  // 3. 주인공의 목표
  sentences.push(
    `${vars.protagonist}는 ${vars.motif}의 진실을 밝히기 위해 ${vars.scale} 전체를 가로지르는 여정을 시작한다.`
  );

  // 4. 갈등/대립
  sentences.push(
    `하지만 ${vars.conflict}이 그의 앞을 가로막으며, 예상치 못한 선택을 강요한다.`
  );

  // 5. 반전 예고 또는 긴장 고조
  if (rng() > 0.5) {
    sentences.push(
      `숨겨진 진실이 드러나면서, ${vars.motif}가 처음 생각했던 것과 전혀 다른 의미를 지니고 있음을 깨닫는다.`
    );
  } else {
    sentences.push(
      `${vars.relationship} 사이의 신뢰가 흔들리고, ${vars.protagonist}는 고립된 채 결정적 순간을 맞이한다.`
    );
  }

  // 6. 톤에 맞는 마무리
  if (tone === "light") {
    sentences.push(
      `희망의 끈을 놓지 않은 채, 그는 모든 것을 건 마지막 시도를 준비한다.`
    );
  } else if (tone === "hard") {
    sentences.push(
      `대가는 크지만, ${vars.protagonist}는 물러설 수 없는 지점에 도달한다.`
    );
  } else {
    sentences.push(
      `이미 돌이킬 수 없는 선택을 한 그는, 파국으로 치달는 운명을 직시한다.`
    );
  }

  return sentences.join(" ");
}
