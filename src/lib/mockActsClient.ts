/**
 * mockActsClient.ts
 *
 * Mock 5막 구조 생성기 - 실제 AI 호출 없이 ActsResult 생성
 * Seed 기반으로 동일한 입력 → 동일한 결과 보장
 */

import type { GenerateActsInput, ActsResult, Act, ActKey } from "@/types/acts";
import type { ToneKey } from "@/types/options";
import { seededRandom } from "./random";

const ACT_TITLES: Record<ActKey, string> = {
  setup: "1막: 발단",
  progress: "2막: 전개",
  crisis: "3막: 위기",
  climax: "4막: 절정",
  resolution: "5막: 결말",
};

/**
 * Mock 5막 구조 생성
 */
export function mockGenerateActs(input: GenerateActsInput): ActsResult {
  const { logline, synopsis, state } = input;
  const seed = state.seed;
  const rng = seededRandom(seed);
  const tone = state.tone;

  const acts: Act[] = [
    {
      key: "setup",
      title: ACT_TITLES.setup,
      summary: generateActSummary("setup", logline, synopsis, tone, rng),
    },
    {
      key: "progress",
      title: ACT_TITLES.progress,
      summary: generateActSummary("progress", logline, synopsis, tone, rng),
    },
    {
      key: "crisis",
      title: ACT_TITLES.crisis,
      summary: generateActSummary("crisis", logline, synopsis, tone, rng),
    },
    {
      key: "climax",
      title: ACT_TITLES.climax,
      summary: generateActSummary("climax", logline, synopsis, tone, rng),
    },
    {
      key: "resolution",
      title: ACT_TITLES.resolution,
      summary: generateActSummary("resolution", logline, synopsis, tone, rng),
    },
  ];

  return { acts, state };
}

/**
 * 각 막의 요약 생성
 */
function generateActSummary(
  actKey: ActKey,
  logline: string,
  synopsis: string,
  tone: ToneKey,
  rng: () => number
): string {
  const toneModifier = getToneModifier(tone);

  switch (actKey) {
    case "setup":
      return generateSetupSummary(logline, synopsis, toneModifier, rng);
    case "progress":
      return generateProgressSummary(logline, synopsis, toneModifier, rng);
    case "crisis":
      return generateCrisisSummary(logline, synopsis, toneModifier, rng);
    case "climax":
      return generateClimaxSummary(logline, synopsis, toneModifier, rng);
    case "resolution":
      return generateResolutionSummary(logline, synopsis, toneModifier, rng);
    default:
      return "요약 생성 중...";
  }
}

/**
 * 톤에 따른 수식어
 */
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

/**
 * 1막: 발단 - 이야기 시작 전 기본 정보/상태/세계관 소개
 */
function generateSetupSummary(
  logline: string,
  synopsis: string,
  toneModifier: { conflict: string; emotion: string; ending: string },
  rng: () => number
): string {
  const templates = [
    `이야기는 일상적인 세계에서 시작된다. 주인공은 자신만의 삶을 살아가고 있으며, 아직 큰 사건을 마주하지 않았다. 주변 인물들과의 관계가 소개되고, 세계관의 기본 규칙이 드러난다. ${toneModifier.emotion} 분위기 속에서 평범한 일상이 지속되지만, 곧 변화가 찾아올 조짐이 보인다.`,
    `주인공의 일상과 세계관이 펼쳐진다. 이들이 살아가는 환경, 관계, 그리고 내면의 상태가 자연스럽게 드러난다. 아직 갈등은 표면화되지 않았지만, ${toneModifier.conflict} 분위기가 감돌며 무언가 변화의 기운이 느껴진다. 등장인물들의 일상적인 모습을 통해 이야기의 기반이 마련된다.`,
    `평범한 일상 속에서 주인공의 삶이 그려진다. 세계관의 특징과 주변 인물들의 성격이 소개되며, 주인공이 가진 내적 갈등이나 외적 상황이 암시된다. ${toneModifier.emotion} 정서가 깔려 있으며, 독자는 이 세계에 점차 몰입하게 된다. 아직 본격적인 사건은 일어나지 않았다.`,
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

/**
 * 2막: 전개 - 작은 갈등 시작, 인물 서사/관계 드러남
 */
function generateProgressSummary(
  logline: string,
  synopsis: string,
  toneModifier: { conflict: string; emotion: string; ending: string },
  rng: () => number
): string {
  const templates = [
    `주인공에게 작은 사건이 찾아온다. 일상에 균열이 생기며, 인물 간의 관계가 조금씩 변화하기 시작한다. ${toneModifier.conflict} 갈등이 싹트고, 주인공은 자신의 선택에 대해 고민하게 된다. 이 과정에서 주변 인물들의 진짜 모습이 드러나며, 이야기는 본격적인 전개를 향해 나아간다.`,
    `초기의 사건이 발생하며 주인공의 삶에 변화가 일어난다. 인물들 사이의 미묘한 긴장감이 형성되고, ${toneModifier.emotion} 감정이 교차한다. 주인공은 새로운 상황에 적응하려 하지만, 예상치 못한 문제들이 하나씩 나타난다. 관계의 역학이 복잡해지며 갈등의 씨앗이 자라난다.`,
    `일상의 균형이 깨지기 시작한다. 주인공은 ${toneModifier.conflict} 상황에 직면하며, 자신의 선택이 가져올 결과를 고민한다. 주변 인물들과의 관계에서 새로운 면모가 발견되고, 서사는 점차 복잡성을 더해간다. 아직 결정적인 순간은 아니지만, 긴장감이 고조되기 시작한다.`,
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

/**
 * 3막: 위기 - 메인 사건 본격화, 사건 심화
 */
function generateCrisisSummary(
  logline: string,
  synopsis: string,
  toneModifier: { conflict: string; emotion: string; ending: string },
  rng: () => number
): string {
  const templates = [
    `갈등이 본격적으로 심화된다. 주인공은 ${toneModifier.conflict} 위기에 처하며, 더 이상 회피할 수 없는 상황에 몰린다. 인물 간의 대립이 첨예해지고, 선택의 순간이 다가온다. 긴장감이 최고조에 이르며, 주인공의 내면과 외면 모두에서 격렬한 충돌이 일어난다. 이제 돌이킬 수 없는 지점을 향해 나아간다.`,
    `메인 사건이 폭발한다. ${toneModifier.emotion} 정서가 이야기를 지배하며, 주인공은 가장 힘든 시련을 맞이한다. 관계는 극한까지 밀려나고, 모든 것이 무너질 듯한 순간이 찾아온다. 주인공은 자신의 한계와 마주하며, 결정적인 선택을 앞두고 고뇌한다. 사건의 파고가 최고점을 향해 치솟는다.`,
    `위기가 절정에 달한다. 주인공과 주변 인물들은 ${toneModifier.conflict} 상황 속에서 각자의 본모습을 드러낸다. 신뢰가 무너지거나 새로운 유대가 형성되며, 이야기는 급격한 전환점을 맞이한다. 더 이상 평범한 해결책은 통하지 않으며, 주인공은 극단적인 선택을 고민하게 된다.`,
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

/**
 * 4막: 절정 - 가장 큰 사건, 내/외적 변화 발생
 */
function generateClimaxSummary(
  logline: string,
  synopsis: string,
  toneModifier: { conflict: string; emotion: string; ending: string },
  rng: () => number
): string {
  const templates = [
    `모든 것이 결정되는 순간이 찾아온다. 주인공은 ${toneModifier.emotion} 대결 또는 선택의 기로에 서며, 자신의 모든 것을 걸고 행동한다. 내면의 변화와 외적 사건이 동시에 폭발하며, 이야기의 핵심 갈등이 해소된다. 이 과정에서 주인공은 근본적으로 변화하고, 세계 또한 달라진다. 가장 극적인 순간이 펼쳐진다.`,
    `절정의 순간. ${toneModifier.conflict} 대립이 최고조에 달하며, 주인공은 마침내 결단을 내린다. 모든 긴장과 갈등이 한 점으로 수렴하며, 이야기는 폭발적인 전환을 겪는다. 주인공의 내면과 외면 모두에서 근본적인 변화가 일어나고, 돌이킬 수 없는 결과가 만들어진다. 이야기의 진짜 의미가 드러나는 순간이다.`,
    `가장 강렬한 사건이 벌어진다. 주인공은 ${toneModifier.emotion} 순간을 맞이하며, 자신의 진정한 모습과 마주한다. 모든 복선과 갈등이 이 순간으로 수렴하며, 극적인 변화가 일어난다. 관계는 재정의되고, 세계는 새로운 질서를 맞이한다. 주인공은 더 이상 예전의 그/그녀가 아니다.`,
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}

/**
 * 5막: 결말 - 메시지 + 주인공 달라진 모습으로 마무리
 */
function generateResolutionSummary(
  logline: string,
  synopsis: string,
  toneModifier: { conflict: string; emotion: string; ending: string },
  rng: () => number
): string {
  const templates = [
    `이야기는 ${toneModifier.ending} 마무리된다. 주인공은 변화된 모습으로 새로운 일상을 맞이한다. 갈등의 여파가 가라앉고, 인물들은 각자의 자리를 찾아간다. 이 과정에서 이야기가 전하고자 하는 메시지가 자연스럽게 드러난다. 독자는 주인공의 여정을 통해 무언가를 느끼고, 이야기는 조용히 막을 내린다.`,
    `모든 사건이 정리되며 새로운 균형이 찾아온다. 주인공은 여정을 통해 얻은 깨달음을 가지고 ${toneModifier.ending} 앞으로 나아간다. 관계는 재정립되고, 세계는 새로운 모습으로 자리 잡는다. 이야기의 핵심 주제와 메시지가 여운으로 남으며, 독자는 주인공의 변화를 통해 카타르시스를 경험한다.`,
    `결말이 찾아온다. ${toneModifier.emotion} 분위기 속에서 주인공의 변화된 모습이 분명히 드러난다. 남겨진 인물들은 각자의 방식으로 앞으로 나아가며, 세계는 새로운 질서를 받아들인다. 이야기가 던진 질문에 대한 답이 암시되고, 독자는 여운과 함께 이야기를 떠난다. 주인공의 여정은 끝났지만, 그 의미는 계속된다.`,
  ];

  const idx = Math.floor(rng() * templates.length);
  return templates[idx];
}
