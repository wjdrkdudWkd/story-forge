/**
 * ideaPrompt.ts
 *
 * 아이디어 생성 프롬프트 빌더
 * - 안정적인 시스템/규칙이 먼저, 가변적인 입력이 뒤에 (캐싱 최적화)
 */

import type { GenerateIdeaInput } from "@/types/idea";

export const IDEA_PROMPT_VERSION = "idea-v1";

/**
 * 아이디어 생성 프롬프트 구성
 */
export function buildIdeaPrompt(input: GenerateIdeaInput): string {
  const { form, compactedPayload } = input;

  // 안정적인 부분 (캐싱 친화적)
  const systemSection = `# SYSTEM
You are a creative story idea generator for Korean storytelling.
Your task is to generate compelling story concepts based on user preferences.

# TASK
Generate TWO distinct story candidates with:
1. A concise logline (1-2 sentences)
2. A detailed synopsis (6-8 sentences)
3. Relevant tags (up to 8 tags)

Each candidate should explore different narrative angles while respecting the user's preferences.

# RULES
- Write in Korean
- Candidates must be distinct from each other (different focus/approach)
- Loglines should be compelling and hook-driven
- Synopsis should establish world, character, conflict, and stakes
- Tags should be relevant and specific
- Respect tone and realism preferences
- Use world-building elements creatively

# OUTPUT FORMAT
Return JSON with this exact structure:
{
  "candidates": [
    {
      "logline": "string",
      "synopsis": "string",
      "tags": ["string", ...]
    },
    ...
  ]
}
`;

  // 가변적인 부분 (사용자 입력)
  const inputSection = `
# USER INPUT
Tone: ${form.tone}
Realism: ${form.realism ?? "not specified"}

Selected Options:
${JSON.stringify(compactedPayload, null, 2)}

Generate two distinct story candidates based on the above preferences.
`;

  return systemSection + inputSection;
}
