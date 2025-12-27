/**
 * eventStore.ts
 *
 * 서버 측 이벤트 스토어
 * - FileEventStore: 로컬 JSONL 파일에 저장
 * - EventStore 인터페이스로 나중에 Supabase로 교체 가능
 */

import { promises as fs } from "fs";
import path from "path";
import type { EventRecord } from "@/types/events";

/**
 * EventStore 인터페이스
 * 나중에 SupabaseEventStore로 교체 가능
 */
export interface EventStore {
  write(event: EventRecord): Promise<void>;
  listRecent(limit: number): Promise<EventRecord[]>;
}

/**
 * 파일 기반 이벤트 스토어 (JSONL)
 */
export class FileEventStore implements EventStore {
  private filePath: string;

  constructor(filePath: string = "./.data/events.jsonl") {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  /**
   * 이벤트 기록 (JSONL 형식으로 append)
   */
  async write(event: EventRecord): Promise<void> {
    try {
      // .data 디렉토리 생성 (없으면)
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      // JSONL 형식으로 append
      const line = JSON.stringify(event) + "\n";
      await fs.appendFile(this.filePath, line, "utf-8");
    } catch (error) {
      console.error("[FileEventStore] Failed to write event:", error);
      throw error;
    }
  }

  /**
   * 최근 이벤트 조회
   */
  async listRecent(limit: number): Promise<EventRecord[]> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const lines = content.trim().split("\n").filter((line) => line.trim());

      // 마지막 N개 라인만 파싱
      const recentLines = lines.slice(-limit);
      const events: EventRecord[] = [];

      for (const line of recentLines) {
        try {
          const event = JSON.parse(line) as EventRecord;
          events.push(event);
        } catch (parseError) {
          console.warn("[FileEventStore] Failed to parse line:", line, parseError);
        }
      }

      return events;
    } catch (error) {
      // 파일이 없으면 빈 배열 반환
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      console.error("[FileEventStore] Failed to list recent events:", error);
      throw error;
    }
  }
}

/**
 * 기본 이벤트 스토어 인스턴스
 */
export const eventStore = new FileEventStore();
