/**
 * blockDetailExpandPrompt.ts
 *
 * 블록 상세 확장 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { GenerateBlockDetailInput } from "@/types/blocks";

export const BLOCK_DETAIL_EXPAND_PROMPT_VERSION = "block-detail-expand-v1";

/**
 * 블록 상세 확장 프롬프트 구성
 * Note: Uses same input type as generateBlockDetail since expansion reuses the same context
 */
export function buildBlockDetailExpandPrompt(
  input: GenerateBlockDetailInput & { currentBeat?: string }
): string {
  const { index, spec, overview, state, memory, preset, sentenceRange, currentBeat } =
    input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a prose writer specializing in detailed scene construction for Korean storytelling.
Your task is to rewrite/expand an existing story beat while preserving core events.

# TASK
Rewrite the beat with:
- "beat": Expanded narrative prose (${sentenceRange?.min ?? 6}-${sentenceRange?.max ?? 8} sentences)
- "microHooks": Array of 2-3 improved micro-hooks

# RULES
- Write all content in Korean
- Keep the core events and character actions from the original beat
- Expand with richer detail, deeper character interiority, or enhanced atmosphere
- Respect sentence count constraints (${sentenceRange?.min ?? 6}-${sentenceRange?.max ?? 8} sentences)
- Maintain consistent tone and world-building
- Micro-hooks should create stronger anticipation

# EXPANSION STYLE
${preset === "more_specific" ? "- Add concrete sensory details\n- Specify exact actions and reactions\n- Include environmental details" : ""}
${preset === "raise_stakes" ? "- Emphasize urgency and tension\n- Highlight consequences\n- Add time pressure or risk" : ""}
${preset === "add_emotion" ? "- Deepen internal character thoughts\n- Show emotional reactions\n- Add psychological depth" : ""}
${preset === "add_twist" ? "- Introduce unexpected complication\n- Add surprise element\n- Reveal hidden information" : ""}
${preset === "add_dialogue" ? "- Include character dialogue\n- Use speech to reveal personality\n- Add conversational conflict" : ""}
${!preset ? "- Balanced expansion\n- Enrich existing content without changing core meaning" : ""}

# OUTPUT FORMAT
Return JSON with this structure:
{
  "beat": "string (${sentenceRange?.min ?? 6}-${sentenceRange?.max ?? 8} sentences)",
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

${currentBeat ? `Current Beat (to expand):\n${currentBeat}\n` : ""}

# STORY MEMORY
Protagonist Goal: ${memory.protagonistGoal || "not set"}
Central Conflict: ${memory.centralConflict || "not set"}
${memory.bStory ? `B-Story: ${memory.bStory}` : ""}
${memory.progressFlags.length > 0 ? `Progress Flags: ${memory.progressFlags.join(", ")}` : ""}

Tone: ${state.tone}
${preset ? `Expansion Preset: ${preset}` : ""}

Rewrite the beat as a ${sentenceRange?.min ?? 6}-${sentenceRange?.max ?? 8} sentence expanded version${preset ? ` following the "${preset}" style` : ""}.
`;

  return systemSection + inputSection;
}
