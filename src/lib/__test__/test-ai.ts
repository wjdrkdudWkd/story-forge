/**
 * test-ai.ts
 *
 * AI 클라이언트 수동 테스트
 */

import type { IdeaFormState } from "@/types/form";
import type { GenerateIdeaInput } from "@/types/idea";
import { mockGenerateIdea } from "../mockAiClient";
import { compactFormPayload } from "../aiClient";

// 테스트용 폼 데이터
const testForm: IdeaFormState = {
  tone: "hard",
  realism: 70,
  seed: 12345,
  world_setting: "scifi",
  world_era: "far_future",
  world_scale: "world",
  character_protagonist: "antihero",
  character_count: "solo",
  character_relationship: "strangers",
  plot_structure: "heros_journey",
  plot_conflict: "man_vs_technology",
  plot_ending: "bittersweet",
  motifs_ranked: ["power", "freedom", "identity"],
};

console.log("=".repeat(60));
console.log("AI Client Manual Test");
console.log("=".repeat(60));
console.log();

// Test 1: 동일 seed로 일관성 확인
console.log("Test 1: 동일 seed → 동일 결과 확인");
console.log("-".repeat(60));
const input1: GenerateIdeaInput = {
  form: testForm,
  compactedPayload: compactFormPayload(testForm),
  mode: "mock",
};

const result1 = mockGenerateIdea(input1);
const result2 = mockGenerateIdea(input1);

console.log("첫 번째 생성 - Candidate 1:");
console.log("Logline:", result1.candidates[0].logline);
console.log();

console.log("두 번째 생성 - Candidate 1:");
console.log("Logline:", result2.candidates[0].logline);
console.log();

const isConsistent = result1.candidates[0].logline === result2.candidates[0].logline;
console.log("✓ 일관성 확인:", isConsistent ? "PASS" : "FAIL");
console.log();
console.log();

// Test 2: 다른 seed로 차이 확인
console.log("Test 2: 다른 seed → 다른 결과 확인");
console.log("-".repeat(60));
const input2: GenerateIdeaInput = {
  form: { ...testForm, seed: 99999 },
  compactedPayload: compactFormPayload({ ...testForm, seed: 99999 }),
  mode: "mock",
};

const result3 = mockGenerateIdea(input2);

console.log("Seed 12345 - Logline:");
console.log(result1.candidates[0].logline);
console.log();

console.log("Seed 99999 - Logline:");
console.log(result3.candidates[0].logline);
console.log();

const isDifferent = result1.candidates[0].logline !== result3.candidates[0].logline;
console.log("✓ 차이 확인:", isDifferent ? "PASS" : "FAIL");
console.log();
console.log();

// Test 3: 후보 개수 확인
console.log("Test 3: 후보 개수 확인");
console.log("-".repeat(60));
console.log("생성된 후보 개수:", result1.candidates.length);
console.log("✓ 2개 확인:", result1.candidates.length === 2 ? "PASS" : "FAIL");
console.log();
console.log();

// Test 4: IdeaState 구조 확인
console.log("Test 4: IdeaState 구조 확인");
console.log("-".repeat(60));
console.log(JSON.stringify(result1.state, null, 2));
console.log();
console.log("✓ seed 포함:", result1.state.seed === 12345 ? "PASS" : "FAIL");
console.log("✓ tone 포함:", result1.state.tone === "hard" ? "PASS" : "FAIL");
console.log("✓ world 포함:", result1.state.world !== undefined ? "PASS" : "FAIL");
console.log("✓ character 포함:", result1.state.character !== undefined ? "PASS" : "FAIL");
console.log("✓ plot 포함:", result1.state.plot !== undefined ? "PASS" : "FAIL");
console.log();
console.log();

// Test 5: Logline & Synopsis 검증
console.log("Test 5: Logline & Synopsis 검증");
console.log("-".repeat(60));
result1.candidates.forEach((candidate, i) => {
  console.log(`Candidate ${i + 1}:`);
  console.log("Logline:", candidate.logline);
  console.log("Logline 길이:", candidate.logline.length, "자");
  console.log();
  console.log("Synopsis:", candidate.synopsis);
  console.log("Synopsis 길이:", candidate.synopsis.length, "자");
  console.log("Synopsis 문장 수:", candidate.synopsis.split(". ").length);
  console.log();
  console.log("Tags:", candidate.tags);
  console.log("Tags 개수:", candidate.tags.length);
  console.log();
  console.log("-".repeat(60));
});

console.log();
console.log("=".repeat(60));
console.log("All Tests Complete");
console.log("=".repeat(60));
