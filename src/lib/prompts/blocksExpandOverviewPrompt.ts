/**
 * blocksExpandOverviewPrompt.ts
 *
 * 블록 개요 확장 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { ExpandOverviewInput } from "@/types/blocks";

export const BLOCKS_EXPAND_OVERVIEW_PROMPT_VERSION =
  "blocks-overview-expand-v1";

/**
 * 블록 개요 확장 프롬프트 구성
 */
export function buildBlocksExpandOverviewPrompt(
  input: ExpandOverviewInput
): string {
  const { index, spec, currentOverview, preset, state, memory } = input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a story architect specializing in beat-by-beat narrative construction.
Your task is to expand and improve an existing block overview based on a specific preset.

# TASK
Expand/improve the current overview with:
- headline: Enhanced 2-3 sentence description
- hooks: Improved array of 2-3 narrative hooks
- stakes: Enhanced stakes description
- tags: Relevant tags
- note: Optional note about changes

# EXPANSION PRESETS
- more_specific: Add concrete details, specific actions, clearer character motivations
- raise_stakes: Increase tension, add urgency, heighten consequences
- add_emotion: Deepen emotional resonance, internal conflict, character feelings
- add_twist: Introduce unexpected element, complication, or revelation
- add_dialogue: Suggest key dialogue moments or verbal conflicts

# RULES
- Write all content in Korean
- Maintain continuity with established story facts and memory
- Apply the preset's focus while keeping the core beat intact
- Do not contradict already-established plot points
- Keep the block's dramatic purpose aligned with the act structure
- Hooks should create stronger momentum toward the next beat
- Overview should be vivid and specific

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

Current Overview (to expand):
Headline: ${currentOverview.headline}
Hooks: ${currentOverview.hooks.join(", ")}
${currentOverview.stakes ? `Stakes: ${currentOverview.stakes}` : ""}

Expansion Preset: ${preset}

# STORY MEMORY
Protagonist Goal: ${memory.protagonistGoal || "not set"}
Central Conflict: ${memory.centralConflict || "not set"}
${memory.bStory ? `B-Story: ${memory.bStory}` : ""}
${memory.progressFlags.length > 0 ? `Progress Flags: ${memory.progressFlags.join(", ")}` : ""}

Tone: ${state.tone}
Seed: ${state.seed}

Expand and improve this overview following the "${preset}" preset guidelines.
`;

  return systemSection + inputSection;
}
