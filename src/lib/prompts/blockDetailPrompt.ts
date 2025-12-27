/**
 * blockDetailPrompt.ts
 *
 * 블록 상세 생성 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { GenerateBlockDetailInput } from "@/types/blocks";

export const BLOCK_DETAIL_PROMPT_VERSION = "block-detail-v1";

/**
 * 블록 상세 생성 프롬프트 구성
 */
export function buildBlockDetailPrompt(input: GenerateBlockDetailInput): string {
  const { index, spec, overview, state, memory, preset, sentenceRange } =
    input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a prose writer specializing in detailed scene construction for Korean storytelling.
Your task is to expand a story beat overview into detailed narrative prose.

# TASK
Write a detailed scene/beat based on the provided overview.
Include:
- "beat": Main narrative prose (${sentenceRange?.min ?? 3}-${sentenceRange?.max ?? 4} sentences)
- "microHooks": Array of 2-3 micro-hooks that connect to the next beat

# RULES
- Write all content in Korean
- Beat should be vivid, specific, and immersive
- Use sensory details and concrete imagery
- Show character emotions and motivations
- Maintain consistent tone throughout
- Respect sentence count constraints
- Micro-hooks should create anticipation for what comes next
- Avoid generic descriptions; be specific to this story
- Consider character voice and world-building details

# STYLE GUIDELINES
- Balanced approach
- Mix of action, description, and character moments
- Clear and engaging prose
${preset ? `- Expansion style: ${preset}` : ""}

# OUTPUT FORMAT
Return JSON with this structure:
{
  "beat": "string (${sentenceRange?.min ?? 3}-${sentenceRange?.max ?? 4} sentences)",
  "microHooks": ["string", "string", "string"]
}
`;

  // 가변적인 부분 (사용자 입력)
  const inputSection = `
# BLOCK CONTEXT
Block Index: ${index}
Block Title: ${spec.title}
Act Purpose: ${spec.purpose}

Current Overview: ${overview.headline}
Overview Hooks: ${overview.hooks.join(", ")}

# STORY MEMORY
Protagonist Goal: ${memory.protagonistGoal || "not set"}
Central Conflict: ${memory.centralConflict || "not set"}
${memory.bStory ? `B-Story: ${memory.bStory}` : ""}
${memory.progressFlags.length > 0 ? `Progress Flags: ${memory.progressFlags.join(", ")}` : ""}
${memory.lastHooks && memory.lastHooks.length > 0 ? `Previous Hooks: ${memory.lastHooks.join(", ")}` : ""}

Tone: ${state.tone}
${preset ? `Expansion Preset: ${preset}` : ""}

Write a detailed ${sentenceRange?.min ?? 3}-${sentenceRange?.max ?? 4} sentence beat for this block.
`;

  return systemSection + inputSection;
}
