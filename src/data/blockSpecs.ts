/**
 * blockSpecs.ts
 *
 * 24블록 구조의 고정 템플릿
 */

import type { BlockSpec } from "@/types/blocks";

export const BLOCK_SPECS: BlockSpec[] = [
  // Act 1: 1~6
  {
    index: 1,
    act: 1,
    title: "오프닝이벤트",
    purpose: "이야기의 첫 인상을 결정하는 사건으로 독자의 관심을 끌어당긴다.",
  },
  {
    index: 2,
    act: 1,
    title: "주인공 소개(1)",
    purpose: "주인공의 일상과 성격, 환경을 보여주며 독자가 공감할 수 있는 기반을 만든다.",
  },
  {
    index: 3,
    act: 1,
    title: "주인공 소개(2)",
    purpose: "주인공의 내적 갈등이나 결핍을 드러내어 성장의 여지를 암시한다.",
  },
  {
    index: 4,
    act: 1,
    title: "도입이벤트",
    purpose: "주인공의 일상을 깨뜨리는 결정적 사건이 발생하여 이야기가 본격적으로 시작된다.",
  },
  {
    index: 5,
    act: 1,
    title: "후유증",
    purpose: "도입이벤트의 여파로 주인공이 겪는 혼란과 저항을 그린다.",
  },
  {
    index: 6,
    act: 1,
    title: "후유증의 해소",
    purpose: "주인공이 새로운 상황을 받아들이고 본격적인 여정을 시작하기로 결심한다.",
  },

  // Act 2: 7~12
  {
    index: 7,
    act: 2,
    title: "시작점",
    purpose: "주인공이 본격적으로 목표를 향해 움직이기 시작하며 새로운 세계에 진입한다.",
  },
  {
    index: 8,
    act: 2,
    title: "자격시험/B-story",
    purpose: "주인공의 능력이나 자격을 시험하는 사건이 벌어지고, 부차적인 관계가 형성된다.",
  },
  {
    index: 9,
    act: 2,
    title: "악마의 발톱",
    purpose: "적대 세력이나 장애물이 처음으로 모습을 드러내며 주인공을 위협한다.",
  },
  {
    index: 10,
    act: 2,
    title: "조력자들의 합류",
    purpose: "주인공이 동료나 조력자를 얻으며 여정에 필요한 자원을 확보한다.",
  },
  {
    index: 11,
    act: 2,
    title: "콘타고니스트와의 투쟁",
    purpose: "주인공과 적대 세력 간의 대립이 본격화되며 갈등이 심화된다.",
  },
  {
    index: 12,
    act: 2,
    title: "위기와 좌절",
    purpose: "주인공이 큰 실패를 겪으며 목표 달성이 어려워 보이는 상황에 처한다.",
  },

  // Act 3: 13~18
  {
    index: 13,
    act: 3,
    title: "전환점",
    purpose: "주인공이 새로운 깨달음이나 정보를 얻어 상황을 반전시킬 계기를 마련한다.",
  },
  {
    index: 14,
    act: 3,
    title: "악마의 정체",
    purpose: "적대 세력의 진짜 의도나 정체가 드러나며 갈등의 본질이 명확해진다.",
  },
  {
    index: 15,
    act: 3,
    title: "B-story",
    purpose: "부차적 관계나 내적 성장이 강조되며 주인공의 변화가 가시화된다.",
  },
  {
    index: 16,
    act: 3,
    title: "전면투쟁(1)",
    purpose: "주인공이 적극적으로 문제에 맞서며 본격적인 대결 구도가 형성된다.",
  },
  {
    index: 17,
    act: 3,
    title: "전면투쟁(2)",
    purpose: "투쟁이 격화되며 주인공과 적대 세력 모두 한계에 도달한다.",
  },
  {
    index: 18,
    act: 3,
    title: "더 큰 위기와 좌절",
    purpose: "주인공이 최악의 상황에 직면하며 모든 것을 잃을 위기에 처한다.",
  },

  // Act 4: 19~24
  {
    index: 19,
    act: 4,
    title: "피크점",
    purpose: "주인공이 마지막 힘을 끌어모아 결정적 행동을 준비하는 순간이다.",
  },
  {
    index: 20,
    act: 4,
    title: "결사항전",
    purpose: "주인공과 적대 세력의 최종 대결이 시작되며 긴장감이 최고조에 달한다.",
  },
  {
    index: 21,
    act: 4,
    title: "최악의 위기",
    purpose: "대결 중 예상치 못한 반전이나 최대 위기가 찾아와 결과를 예측할 수 없게 된다.",
  },
  {
    index: 22,
    act: 4,
    title: "보상과 축복",
    purpose: "주인공이 목표를 달성하거나 변화를 완성하며 갈등이 해소된다.",
  },
  {
    index: 23,
    act: 4,
    title: "결말",
    purpose: "이야기의 여파가 정리되고 주인공의 새로운 상태가 제시된다.",
  },
  {
    index: 24,
    act: 4,
    title: "에필로그",
    purpose: "이야기의 주제와 메시지를 정리하며 독자에게 여운을 남긴다.",
  },
];
