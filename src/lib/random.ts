/**
 * random.ts
 *
 * Seed 기반 랜덤 생성 유틸리티
 */

import type { Option } from "@/types/options";

/**
 * Seeded Random Number Generator (Mulberry32)
 *
 * @param seed - 랜덤 시드
 * @returns 0~1 사이의 난수 생성 함수
 */
export function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 가중치 기반 랜덤 선택
 *
 * @param options - 선택 가능한 옵션 배열
 * @param rng - 랜덤 함수 (seededRandom 사용)
 * @returns 선택된 Option
 */
export function weightedRandom(
  options: Option[],
  rng: () => number
): Option | undefined {
  if (options.length === 0) return undefined;

  const totalWeight = options.reduce(
    (sum, opt) => sum + (opt.weight ?? 1),
    0
  );
  let random = rng() * totalWeight;

  for (const option of options) {
    random -= option.weight ?? 1;
    if (random <= 0) {
      return option;
    }
  }

  return options[options.length - 1];
}

/**
 * 배열 셔플 (Fisher-Yates)
 *
 * @param array - 셔플할 배열
 * @param rng - 랜덤 함수 (seededRandom 사용)
 * @returns 셔플된 새 배열
 */
export function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 새로운 랜덤 시드 생성
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}
