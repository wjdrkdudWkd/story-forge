/**
 * events.ts
 *
 * Analytics/Event logging 타입 정의
 */

export type EventName =
  | "idea_generate_clicked"
  | "idea_generated"
  | "idea_candidate_selected"
  | "acts_generate_clicked"
  | "acts_generated"
  | "blocks_overview_generated"
  | "block_opened"
  | "block_detail_generate_clicked"
  | "block_detail_generated"
  | "block_detail_expanded"
  | "block_variant_selected"
  | "quota_exceeded"
  | "cooldown_blocked";

export interface EventRecord {
  id: string; // uuid
  ts: number; // Date.now()
  name: EventName;
  anonId: string;
  sessionId: string;
  userId?: string | null; // reserved for later auth
  projectId?: string | null; // reserved for later projects
  meta?: Record<string, unknown>;
  appVersion?: string;
  route?: string;
}

export interface TrackEventInput {
  name: EventName;
  projectId?: string | null;
  meta?: Record<string, unknown>;
}
