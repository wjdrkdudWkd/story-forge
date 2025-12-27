export type DetailPolicy = {
  autoDetailOnOpen: boolean;
  maxDetailVariantsPerBlock: number;
  maxDetailGenerationsPerSession: number;
  actionCooldownMs: number;
  detailSentenceRange: { min: number; max: number };
  expandSentenceRange: { min: number; max: number };
};

export const DEFAULT_DETAIL_POLICY: DetailPolicy = {
  autoDetailOnOpen: false,
  maxDetailVariantsPerBlock: 3,
  maxDetailGenerationsPerSession: 10,
  actionCooldownMs: 3000,
  detailSentenceRange: { min: 3, max: 4 },
  expandSentenceRange: { min: 6, max: 8 },
};
