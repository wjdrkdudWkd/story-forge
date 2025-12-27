/**
 * actsPrompt.ts
 *
 * 5막 구조 생성 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { GenerateActsInput } from "@/types/acts";

export const ACTS_PROMPT_VERSION = "acts-v1";

/**
 * 5막 구조 생성 프롬프트 구성
 */
export function buildActsPrompt(input: GenerateActsInput): string {
  const { logline, synopsis, state } = input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a story structure architect specializing in Korean narrative formats.
Your task is to create a 5-act structure breakdown for a given story concept.

# TASK
Generate a 5-act structure with these acts:
1. Setup (발단): Introduce world, characters, and initial state
2. Progress (전개): Initial conflict emerges, relationships develop
3. Crisis (위기): Main conflict intensifies, stakes rise
4. Climax (절정): Peak dramatic moment, decisive confrontation
5. Resolution (결말): Aftermath, character transformation, thematic conclusion

Each act should have:
- key: Act identifier (setup/progress/crisis/climax/resolution)
- title: Korean title with act number
- summary: Detailed summary (3-5 sentences) explaining what happens in this act

# RULES
- Write summaries in Korean
- Each act must flow naturally into the next
- Maintain narrative cohesion across all 5 acts
- Respect the tone established in the story concept
- Each summary should be specific to the story, not generic template text
- Include emotional beats and character development
- Consider B-story (relationship/internal journey) alongside A-story (external plot)

# OUTPUT FORMAT
Return JSON with this exact structure:
{
  "acts": [
    {
      "key": "setup",
      "title": "1막: 발단",
      "summary": "string (3-5 sentences)"
    },
    ...
  ]
}
`;

  // 가변적인 부분 (사용자 입력)
  const inputSection = `
# STORY CONCEPT
Logline: ${logline}

Synopsis: ${synopsis}

Tone: ${state.tone}
${state.motifsRanked ? `Key Motifs: ${state.motifsRanked.slice(0, 3).join(", ")}` : ""}

Generate a detailed 5-act structure for this story.
`;

  return systemSection + inputSection;
}
