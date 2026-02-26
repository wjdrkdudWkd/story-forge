/**
 * characterClient.ts
 *
 * 캐릭터 제안 API 클라이언트 (mock / server 모드)
 */

import type {
  GetCharacterSuggestionsInput,
  GetCharacterSuggestionsResult,
  CharacterSuggestion,
  CharacterTrait,
} from '@/types/character';

// ─────────────────────────────────────────────
// Mock 데이터 생성
// ─────────────────────────────────────────────

function makeTrait(id: string, flaw: string, desire: string, label: string): CharacterTrait {
  return { id, flaw, desire, label };
}

const PROTAGONIST_TRAITS: CharacterTrait[] = [
  makeTrait('p1', '과거의 실패에서 벗어나지 못하는 죄책감', '사랑하는 사람을 지키고 싶다', '죄책감형 보호자'),
  makeTrait('p2', '타인을 믿지 못하는 불신', '진정한 소속감과 유대를 갈망한다', '고독한 방랑자'),
  makeTrait('p3', '완벽해야 한다는 강박', '있는 그대로의 나를 인정받고 싶다', '완벽주의 이상주의자'),
];

const ANTAGONIST_TRAITS: CharacterTrait[] = [
  makeTrait('a1', '상처받을 것에 대한 두려움', '절대적 통제와 안전을 원한다', '통제형 방어자'),
  makeTrait('a2', '오래된 분노와 억울함', '세상이 자신의 고통을 인정해주길 바란다', '분노형 복수자'),
  makeTrait('a3', '자신의 가치에 대한 공허함', '힘과 영향력으로 자신의 존재를 증명하려 한다', '야망형 공허자'),
];

const SUPPORTER_TRAITS: CharacterTrait[] = [
  makeTrait('s1', '자신의 감정을 억누르는 희생', '가까운 사람이 행복해지길 바란다', '헌신적 조력자'),
  makeTrait('s2', '우유부단함과 갈등 회피', '모두가 평화롭게 공존하길 바란다', '중재형 화합자'),
  makeTrait('s3', '현실과 이상 사이의 혼란', '의미 있는 무언가에 기여하고 싶다', '방황하는 이상주의자'),
];

function mockGetCharacterSuggestions(
  _input: GetCharacterSuggestionsInput
): GetCharacterSuggestionsResult {
  const suggestions: CharacterSuggestion[] = [
    {
      role: 'protagonist',
      defaultName: '주인공',
      defaultDescription: '내면의 상처를 안고 세상에 맞서는 인물',
      traits: PROTAGONIST_TRAITS,
    },
    {
      role: 'antagonist',
      defaultName: '반동인물',
      defaultDescription: '주인공과 대립하며 갈등을 만드는 인물',
      traits: ANTAGONIST_TRAITS,
    },
    {
      role: 'supporter',
      defaultName: '조력자',
      defaultDescription: '주인공의 여정을 돕는 인물',
      traits: SUPPORTER_TRAITS,
    },
  ];
  return { suggestions };
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export async function getCharacterSuggestions(
  input: GetCharacterSuggestionsInput
): Promise<GetCharacterSuggestionsResult> {
  const mode = input.mode ?? 'mock';

  if (mode === 'mock') {
    // 실감나는 딜레이
    await new Promise((r) => setTimeout(r, 600));
    return mockGetCharacterSuggestions(input);
  }

  // server 모드: 실제 API 호출 (추후 구현)
  const res = await fetch('/api/v1/story/character-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logline: input.logline }),
  });
  if (!res.ok) throw new Error(`character suggestions API error: ${res.status}`);
  return res.json() as Promise<GetCharacterSuggestionsResult>;
}
