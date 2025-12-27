/**
 * blocksOverviewPrompt.ts
 *
 * 24블록 개요 생성 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { GenerateBlocksOverviewInput } from "@/types/blocks";

export const BLOCKS_OVERVIEW_PROMPT_VERSION = "blocks-overview-v1";

/**
 * 24블록 개요 생성 프롬프트 구성
 */
export function buildBlocksOverviewPrompt(
  input: GenerateBlocksOverviewInput
): string {
  const { candidate, state, acts } = input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a detailed story architect specializing in beat-by-beat narrative construction.
Your task is to create 24 story blocks (beats) that form a complete narrative structure.

# TASK
Generate 24 blocks, each representing a key story beat or scene.
Each block should include:
- index: Block number (0-23)
- overview: A concise description (2-3 sentences) of what happens in this beat
- hooks: Array of 2-3 narrative hooks for the next block

Blocks are organized across 5 acts:
- Act 1 (Setup): Blocks 0-4 (5 blocks)
- Act 2 (Progress): Blocks 5-9 (5 blocks)
- Act 3 (Crisis): Blocks 10-14 (5 blocks)
- Act 4 (Climax): Blocks 15-19 (5 blocks)
- Act 5 (Resolution): Blocks 20-23 (4 blocks)

# RULES
- Write all content in Korean
- Each block must advance the story meaningfully
- Blocks within an act should follow the act's dramatic purpose
- Overview should be specific, not generic
- Hooks should create momentum and anticipation
- Maintain consistent character voice and world rules
- Consider both A-story (external plot) and B-story (internal/relational)
- Each block should feel like a distinct scene or story beat
- Progressive tension building across acts
- Avoid repetition between blocks

# OUTPUT FORMAT
Return JSON with this structure:
{
  "blocks": [
    {
      "index": 0,
      "overview": "string (2-3 sentences)",
      "hooks": ["string", "string", "string"]
    },
    ...
  ]
}
`;

  // 가변적인 부분 (사용자 입력)
  const actsText = acts
    ? acts.acts.map((act) => `${act.title}: ${act.summary}`).join("\n\n")
    : "No act structure provided";

  const inputSection = `
# STORY CONCEPT
Logline: ${candidate.logline}

Synopsis: ${candidate.synopsis}

Tone: ${state.tone}
Seed: ${state.seed}

# ACT STRUCTURE
${actsText}

Generate 24 detailed story blocks that bring this story to life, following the act structure above.
`;

  return systemSection + inputSection;
}
