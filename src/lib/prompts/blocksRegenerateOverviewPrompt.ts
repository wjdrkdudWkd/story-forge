/**
 * blocksRegenerateOverviewPrompt.ts
 *
 * 블록 개요 재생성 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { RegenerateOverviewInput } from "@/types/blocks";

export const BLOCKS_REGEN_OVERVIEW_PROMPT_VERSION =
  "blocks-overview-regenerate-v1";

/**
 * 블록 개요 재생성 프롬프트 구성
 */
export function buildBlocksRegenerateOverviewPrompt(
  input: RegenerateOverviewInput
): string {
  const { index, spec, currentOverview, state, memory } = input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a story architect specializing in beat-by-beat narrative construction.
Your task is to regenerate an alternative overview for a story block while maintaining narrative continuity.

# TASK
Generate a new overview variant for this block with:
- headline: A concise 2-3 sentence description of what happens in this beat
- hooks: Array of 2-3 narrative hooks for the next block
- stakes: Optional stakes description
- tags: Optional array of relevant tags
- note: Optional note about this beat

# RULES
- Write all content in Korean
- Maintain continuity with established story facts and memory
- The new overview should explore a different angle/approach than the current one
- Do not contradict already-established plot points or character traits
- Keep the block's core dramatic purpose aligned with the act structure
- Hooks should create momentum toward the next beat
- Overview should be specific, not generic

# OUTPUT FORMAT
Return JSON with this structure:
{
  "headline": "string (2-3 sentences)",
  "hooks": ["string", "string", "string"],
  "stakes": "string (optional)",
  "tags": ["string", ...] (optional),
  "note": "string (optional)"
}
`;

  // 가변적인 부분 (사용자 입력)
  const inputSection = `
# BLOCK CONTEXT
Block Index: ${index}
Block Title: ${spec.title}
Act Purpose: ${spec.purpose}

Current Overview (to regenerate):
Headline: ${currentOverview.headline}
Hooks: ${currentOverview.hooks.join(", ")}
${currentOverview.stakes ? `Stakes: ${currentOverview.stakes}` : ""}

# STORY MEMORY
Protagonist Goal: ${memory.protagonistGoal || "not set"}
Central Conflict: ${memory.centralConflict || "not set"}
${memory.bStory ? `B-Story: ${memory.bStory}` : ""}
${memory.progressFlags.length > 0 ? `Progress Flags: ${memory.progressFlags.join(", ")}` : ""}

Tone: ${state.tone}
Seed: ${state.seed}

Generate an alternative overview for this block that explores a different narrative angle while maintaining story continuity.
`;

  return systemSection + inputSection;
}
