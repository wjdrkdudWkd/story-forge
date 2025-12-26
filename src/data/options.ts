/**
 * options.ts
 *
 * 스토리 아이디어 생성을 위한 옵션 데이터
 */

import type { OptionGroup } from "@/types/options";

/**
 * 세계관 옵션 그룹
 */
export const WORLD_OPTIONS: OptionGroup[] = [
  {
    id: "world_setting",
    label: "세계관 설정",
    options: [
      { key: "fantasy", label: "판타지", tags: ["magic", "medieval"] },
      { key: "scifi", label: "SF", tags: ["future", "technology"] },
      { key: "modern", label: "현대", tags: ["realistic", "contemporary"] },
      { key: "historical", label: "역사", tags: ["past", "period"] },
      { key: "post_apocalyptic", label: "포스트 아포칼립스", tags: ["dystopia", "survival"] },
    ],
  },
  {
    id: "world_era",
    label: "시대 배경",
    options: [
      { key: "ancient", label: "고대" },
      { key: "medieval", label: "중세" },
      { key: "modern", label: "현대" },
      { key: "near_future", label: "가까운 미래" },
      { key: "far_future", label: "먼 미래" },
    ],
  },
  {
    id: "world_scale",
    label: "공간 스케일",
    options: [
      { key: "single_location", label: "단일 장소" },
      { key: "city", label: "도시" },
      { key: "nation", label: "국가" },
      { key: "continent", label: "대륙" },
      { key: "world", label: "세계" },
      { key: "multiverse", label: "다중우주" },
    ],
  },
];

/**
 * 캐릭터 옵션 그룹
 */
export const CHARACTER_OPTIONS: OptionGroup[] = [
  {
    id: "character_protagonist",
    label: "주인공 유형",
    options: [
      { key: "hero", label: "영웅형", tags: ["brave", "moral"] },
      { key: "antihero", label: "안티히어로", tags: ["flawed", "complex"] },
      { key: "everyman", label: "평범한 사람", tags: ["relatable", "ordinary"] },
      { key: "villain", label: "악당 주인공", tags: ["dark", "antagonist"] },
      { key: "ensemble", label: "앙상블", tags: ["multiple", "group"] },
    ],
  },
  {
    id: "character_count",
    label: "주인공 수",
    options: [
      { key: "solo", label: "단독 주인공" },
      { key: "duo", label: "2인 (듀오)" },
      { key: "small_group", label: "소규모 그룹 (3~5명)" },
      { key: "large_group", label: "대규모 그룹 (6명 이상)" },
    ],
  },
  {
    id: "character_relationship",
    label: "관계 구조",
    options: [
      { key: "rivals", label: "라이벌" },
      { key: "mentor_student", label: "스승-제자" },
      { key: "family", label: "가족" },
      { key: "friends", label: "친구" },
      { key: "lovers", label: "연인" },
      { key: "strangers", label: "낯선 이들" },
    ],
  },
];

/**
 * 플롯 옵션 그룹
 */
export const PLOT_OPTIONS: OptionGroup[] = [
  {
    id: "plot_structure",
    label: "플롯 구조",
    options: [
      { key: "heros_journey", label: "영웅의 여정", tags: ["classic", "adventure"] },
      { key: "three_act", label: "3막 구조", tags: ["traditional"] },
      { key: "nonlinear", label: "비선형", tags: ["complex", "experimental"] },
      { key: "episodic", label: "에피소드형", tags: ["serial", "anthology"] },
      { key: "parallel", label: "평행 서사", tags: ["multiple", "intertwined"] },
    ],
  },
  {
    id: "plot_conflict",
    label: "갈등 유형",
    options: [
      { key: "man_vs_man", label: "인간 vs 인간" },
      { key: "man_vs_self", label: "인간 vs 자아" },
      { key: "man_vs_society", label: "인간 vs 사회" },
      { key: "man_vs_nature", label: "인간 vs 자연" },
      { key: "man_vs_technology", label: "인간 vs 기술" },
      { key: "man_vs_fate", label: "인간 vs 운명" },
    ],
  },
  {
    id: "plot_ending",
    label: "엔딩 방향",
    options: [
      { key: "happy", label: "해피엔딩" },
      { key: "bittersweet", label: "비터스위트" },
      { key: "tragic", label: "비극" },
      { key: "open", label: "열린 결말" },
      { key: "twist", label: "반전" },
    ],
  },
];

/**
 * 모티프 옵션 (우선순위 지정용)
 */
export const MOTIF_OPTIONS: OptionGroup = {
  id: "motifs_ranked",
  label: "모티프 우선순위",
  options: [
    { key: "revenge", label: "복수", tags: ["vendetta", "justice"] },
    { key: "love", label: "사랑", tags: ["romance", "relationship"] },
    { key: "power", label: "권력", tags: ["ambition", "control"] },
    { key: "survival", label: "생존", tags: ["danger", "perseverance"] },
    { key: "redemption", label: "구원", tags: ["forgiveness", "change"] },
    { key: "discovery", label: "발견", tags: ["exploration", "knowledge"] },
    { key: "betrayal", label: "배신", tags: ["deception", "trust"] },
    { key: "sacrifice", label: "희생", tags: ["selflessness", "loss"] },
    { key: "freedom", label: "자유", tags: ["independence", "rebellion"] },
    { key: "identity", label: "정체성", tags: ["self", "belonging"] },
  ],
};

/**
 * 모든 옵션 그룹 (자동 렌더링용)
 */
export const ALL_OPTION_GROUPS: OptionGroup[] = [
  ...WORLD_OPTIONS,
  ...CHARACTER_OPTIONS,
  ...PLOT_OPTIONS,
];
