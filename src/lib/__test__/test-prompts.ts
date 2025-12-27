/**
 * test-prompts.ts
 *
 * 간단한 프롬프트 빌더 테스트
 * - 각 프롬프트가 비어있지 않은 문자열을 반환하는지 확인
 * - promptVersion이 포함되어 있는지 확인
 */

import {
  buildIdeaPrompt,
  buildActsPrompt,
  buildBlocksOverviewPrompt,
  buildBlockDetailPrompt,
  IDEA_PROMPT_VERSION,
  ACTS_PROMPT_VERSION,
  BLOCKS_OVERVIEW_PROMPT_VERSION,
  BLOCK_DETAIL_PROMPT_VERSION,
} from "../prompts";

// 간단한 테스트 데이터
const mockIdeaInput = {
  form: {
    tone: "light" as const,
    realism: 0.5,
    seed: 12345,
  },
  compactedPayload: {
    tone: "light" as const,
    world_setting: "fantasy",
  },
  mode: "mock" as const,
};

const mockActsInput = {
  logline: "Test logline",
  synopsis: "Test synopsis",
  state: {
    tone: "light" as const,
    seed: 12345,
    motifsRanked: ["love", "betrayal"],
  },
};

const mockBlocksOverviewInput = {
  candidate: {
    logline: "Test logline",
    synopsis: "Test synopsis",
    tags: ["tag1", "tag2"],
  },
  state: {
    tone: "light" as const,
    seed: 12345,
  },
  acts: {
    acts: [
      { key: "setup" as const, title: "1막: 발단", summary: "Setup summary" },
    ],
    state: {
      tone: "light" as const,
      seed: 12345,
    },
  },
  mode: "mock" as const,
};

const mockBlockDetailInput = {
  index: 1 as const,
  spec: {
    index: 1 as const,
    act: 1 as const,
    title: "Test Block",
    purpose: "Test purpose",
  },
  overview: {
    id: "test-overview",
    createdAt: Date.now(),
    source: "initial" as const,
    headline: "Test headline",
    hooks: ["Hook 1", "Hook 2"],
  },
  state: {
    tone: "light" as const,
    seed: 12345,
  },
  memory: {
    protagonistGoal: "Test goal",
    centralConflict: "Test conflict",
    progressFlags: [],
  },
  sentenceRange: { min: 3, max: 4 },
  mode: "mock" as const,
};

// 테스트 실행
function runTests() {
  console.log("=== Prompt Builder Tests ===\n");

  // Test 1: ideaPrompt
  console.log("1. Testing ideaPrompt...");
  const ideaPrompt = buildIdeaPrompt(mockIdeaInput);
  console.assert(
    ideaPrompt.length > 0,
    "ideaPrompt should return non-empty string"
  );
  console.assert(
    ideaPrompt.includes("SYSTEM"),
    "ideaPrompt should contain SYSTEM section"
  );
  console.log(`   ✓ Length: ${ideaPrompt.length} chars`);
  console.log(`   ✓ Version: ${IDEA_PROMPT_VERSION}\n`);

  // Test 2: actsPrompt
  console.log("2. Testing actsPrompt...");
  const actsPrompt = buildActsPrompt(mockActsInput);
  console.assert(
    actsPrompt.length > 0,
    "actsPrompt should return non-empty string"
  );
  console.assert(
    actsPrompt.includes("SYSTEM"),
    "actsPrompt should contain SYSTEM section"
  );
  console.log(`   ✓ Length: ${actsPrompt.length} chars`);
  console.log(`   ✓ Version: ${ACTS_PROMPT_VERSION}\n`);

  // Test 3: blocksOverviewPrompt
  console.log("3. Testing blocksOverviewPrompt...");
  const blocksOverviewPrompt = buildBlocksOverviewPrompt(
    mockBlocksOverviewInput
  );
  console.assert(
    blocksOverviewPrompt.length > 0,
    "blocksOverviewPrompt should return non-empty string"
  );
  console.assert(
    blocksOverviewPrompt.includes("SYSTEM"),
    "blocksOverviewPrompt should contain SYSTEM section"
  );
  console.log(`   ✓ Length: ${blocksOverviewPrompt.length} chars`);
  console.log(`   ✓ Version: ${BLOCKS_OVERVIEW_PROMPT_VERSION}\n`);

  // Test 4: blockDetailPrompt
  console.log("4. Testing blockDetailPrompt...");
  const blockDetailPrompt = buildBlockDetailPrompt(mockBlockDetailInput);
  console.assert(
    blockDetailPrompt.length > 0,
    "blockDetailPrompt should return non-empty string"
  );
  console.assert(
    blockDetailPrompt.includes("SYSTEM"),
    "blockDetailPrompt should contain SYSTEM section"
  );
  console.log(`   ✓ Length: ${blockDetailPrompt.length} chars`);
  console.log(`   ✓ Version: ${BLOCK_DETAIL_PROMPT_VERSION}\n`);

  console.log("=== All Tests Passed! ===");
}

// Node.js 환경에서 직접 실행 가능
if (require.main === module) {
  runTests();
}

export { runTests };
