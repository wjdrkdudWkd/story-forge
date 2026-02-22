# Story-Forge FastAPI 백엔드 API 명세

> 이 문서는 FastAPI + LangGraph 백엔드 개발자가 구현해야 할 엔드포인트와 Pydantic 모델을 정의합니다.
> 프론트엔드(`src/lib/api/storyApi.ts`)는 아래 명세에 맞춰 요청을 보냅니다.

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [Story Generation API](#2-story-generation-api)
3. [Logging API](#3-logging-api)
4. [Pydantic 모델 (전체)](#4-pydantic-모델-전체)
5. [CORS 설정](#5-cors-설정)
6. [에러 응답 형식](#6-에러-응답-형식)

---

## 1. 공통 사항

| 항목 | 값 |
|------|----|
| Base URL | `http://localhost:8000` (개발) |
| API 접두사 | `/api/v1` |
| Content-Type | `application/json` |
| 인증 | 없음 (익명 사용자 ID는 헤더로 전달) |

### 공통 요청 헤더

프론트엔드는 모든 요청에 아래 헤더를 자동으로 포함합니다:

```
X-Anon-Id:    <string>   # 브라우저 localStorage에 저장된 익명 사용자 ID
X-Session-Id: <string>   # 브라우저 sessionStorage에 저장된 세션 ID
Content-Type: application/json
Accept:       application/json
```

> 로깅 엔드포인트(`/api/v1/logs/*`)는 payload에 `anon_id`, `session_id`가 이미 포함되어 있으므로 헤더 대신 body를 사용하세요.

---

## 2. Story Generation API

### 2-1. 아이디어 생성

```
POST /api/v1/story/idea
```

**Request Body**

```json
{
  "form": {
    "tone": "light",
    "realism": 40,
    "seed": 1234567890,
    "world_setting": "modern_city",
    "world_era": "contemporary",
    "world_scale": "personal",
    "character_protagonist": "ordinary_person",
    "character_count": "duo",
    "character_relationship": "rivals",
    "plot_structure": "three_act",
    "plot_conflict": "person_vs_person",
    "plot_ending": "bittersweet",
    "motifs_ranked": ["redemption", "identity", "belonging"]
  },
  "compacted_payload": {
    "tone": "light",
    "realism": 40,
    "seed": 1234567890,
    "world_setting": "modern_city"
  }
}
```

**Response Body** `200 OK`

```json
{
  "candidates": [
    {
      "logline": "한 줄 요약 — 강렬한 훅으로 시작",
      "synopsis": "2~3문단 시놉시스...",
      "tags": ["드라마", "성장", "도시"]
    },
    {
      "logline": "두 번째 후보 로그라인",
      "synopsis": "두 번째 시놉시스...",
      "tags": ["로맨스", "갈등"]
    }
  ],
  "state": {
    "seed": 1234567890,
    "tone": "light",
    "realism": 40,
    "world": {
      "world_setting": "modern_city",
      "world_era": "contemporary",
      "world_scale": "personal"
    },
    "character": {
      "character_protagonist": "ordinary_person",
      "character_count": "duo",
      "character_relationship": "rivals"
    },
    "plot": {
      "plot_structure": "three_act",
      "plot_conflict": "person_vs_person",
      "plot_ending": "bittersweet"
    },
    "motifsRanked": ["redemption", "identity", "belonging"]
  }
}
```

---

### 2-2. 5막 구조 생성

```
POST /api/v1/story/acts
```

**Request Body**

```json
{
  "logline": "선택된 로그라인 텍스트",
  "synopsis": "선택된 시놉시스 텍스트",
  "state": {
    "seed": 1234567890,
    "tone": "light",
    "realism": 40,
    "world": { "world_setting": "modern_city" },
    "character": { "character_protagonist": "ordinary_person" },
    "plot": { "plot_structure": "three_act" },
    "motifsRanked": ["redemption"]
  }
}
```

**Response Body** `200 OK`

```json
{
  "acts": [
    {
      "key": "setup",
      "title": "발단 제목",
      "summary": "발단 요약 텍스트..."
    },
    {
      "key": "progress",
      "title": "전개 제목",
      "summary": "전개 요약..."
    },
    {
      "key": "crisis",
      "title": "위기 제목",
      "summary": "위기 요약..."
    },
    {
      "key": "climax",
      "title": "절정 제목",
      "summary": "절정 요약..."
    },
    {
      "key": "resolution",
      "title": "결말 제목",
      "summary": "결말 요약..."
    }
  ],
  "state": { /* IdeaState 그대로 반환 */ }
}
```

> `act.key`는 반드시 `"setup" | "progress" | "crisis" | "climax" | "resolution"` 중 하나여야 합니다.

---

### 2-3. 24블록 개요 생성

```
POST /api/v1/story/blocks/overview
```

**Request Body**

```json
{
  "logline": "선택된 로그라인",
  "synopsis": "선택된 시놉시스",
  "tags": ["드라마", "성장"],
  "state": { /* IdeaState */ },
  "acts": {
    "acts": [ /* Act[] — 5막 결과, 선택사항 */ ],
    "state": { /* IdeaState */ }
  }
}
```

**Response Body** `200 OK`

```json
{
  "specs": [
    {
      "index": 1,
      "act": 1,
      "title": "일상의 균열",
      "purpose": "주인공의 평범한 일상을 보여주고 핵심 결핍을 암시한다",
      "required": "주인공 소개",
      "deliver": "관객의 공감 형성"
    }
    /* ... 총 24개 */
  ],
  "blocksByIndex": {
    "1": {
      "index": 1,
      "overviewVariants": [
        {
          "id": "uuid-v4",
          "createdAt": 1700000000000,
          "source": "initial",
          "headline": "블록 헤드라인 — 한 문장 요약",
          "hooks": [
            "첫 번째 후크 포인트",
            "두 번째 후크 포인트"
          ],
          "stakes": "이 블록에서의 긴장감",
          "tags": ["갈등", "반전"],
          "note": null
        }
      ],
      "selectedOverviewId": "uuid-v4",
      "detailVariants": [],
      "selectedDetailId": null
    }
    /* ... 총 24개 키 (1~24) */
  },
  "memory": {
    "protagonistGoal": "주인공의 핵심 목표",
    "centralConflict": "중심 갈등",
    "bStory": "서브 스토리",
    "progressFlags": [],
    "lastHooks": []
  }
}
```

---

### 2-4. 블록 상세 생성 (기본 / 확장 공통)

```
POST /api/v1/story/blocks/detail
```

`preset`이 없으면 기본 상세(3~4문장), 있으면 확장 상세(6~8문장)를 생성합니다.

**Request Body**

```json
{
  "block_index": 5,
  "spec": {
    "index": 5,
    "act": 1,
    "title": "블록 제목",
    "purpose": "블록 목적",
    "required": "필수 요소",
    "deliver": "전달 목표"
  },
  "overview": {
    "id": "uuid-v4",
    "createdAt": 1700000000000,
    "source": "initial",
    "headline": "헤드라인",
    "hooks": ["후크1", "후크2"],
    "stakes": "긴장감",
    "tags": [],
    "note": null
  },
  "state": { /* IdeaState */ },
  "memory": {
    "protagonistGoal": "...",
    "centralConflict": "...",
    "bStory": "...",
    "progressFlags": [],
    "lastHooks": []
  },
  "preset": "raise_stakes",
  "sentence_range": { "min": 6, "max": 8 }
}
```

> `preset`은 `null` 또는 아래 5종 중 하나:
> `"more_specific"` | `"raise_stakes"` | `"add_emotion"` | `"add_twist"` | `"add_dialogue"`

**Response Body** `200 OK`

```json
{
  "id": "uuid-v4",
  "createdAt": 1700000000000,
  "source": "generated",
  "beat": "상세 비트 텍스트 (3~4문장 또는 6~8문장)...",
  "microHooks": [
    "미시적 후크 1",
    "미시적 후크 2"
  ],
  "preset": "raise_stakes"
}
```

---

### 2-5. 블록 개요 재생성

```
POST /api/v1/story/blocks/regenerate-overview
```

**Request Body**

```json
{
  "block_index": 3,
  "spec": { /* BlockSpec */ },
  "current_overview": { /* BlockOverviewVariant — 현재 선택된 것 */ },
  "state": { /* IdeaState */ },
  "memory": { /* BlocksMemory */ }
}
```

**Response Body** `200 OK`

```json
{
  "id": "uuid-v4",
  "createdAt": 1700000000000,
  "source": "regenerate",
  "headline": "새로 생성된 헤드라인",
  "hooks": ["새 후크1", "새 후크2"],
  "stakes": "새 긴장감",
  "tags": ["새태그"],
  "note": null
}
```

---

### 2-6. 블록 개요 확장 (프리셋 적용)

```
POST /api/v1/story/blocks/expand-overview
```

**Request Body**

```json
{
  "block_index": 7,
  "spec": { /* BlockSpec */ },
  "current_overview": { /* BlockOverviewVariant */ },
  "preset": "add_emotion",
  "state": { /* IdeaState */ },
  "memory": { /* BlocksMemory */ }
}
```

**Response Body** `200 OK`

```json
{
  "id": "uuid-v4",
  "createdAt": 1700000000000,
  "source": "expand",
  "headline": "감정이 강화된 헤드라인",
  "hooks": ["감정적 후크1", "감정적 후크2"],
  "stakes": "감정적 긴장감",
  "tags": ["감정", "내면"],
  "note": "add_emotion 프리셋 적용됨"
}
```

---

## 3. Logging API

> 로깅은 **best-effort**입니다. 실패해도 프론트엔드 동작에 영향이 없습니다.
> 백엔드는 200이 아닌 응답을 반환해도 괜찮으며, 프론트엔드는 1회 재시도 후 포기합니다.

### 3-1. AI 호출 로그

```
POST /api/v1/logs/ai-call
```

**Request Body**

```json
{
  "anon_id": "anon_abc123",
  "session_id": "sess_xyz789",
  "stage": "idea",
  "mode": "server",
  "model": "claude-3-5-sonnet",
  "prompt": "실제 프롬프트 전문 (최대 100KB)",
  "response": "실제 응답 전문 (최대 100KB)",
  "prompt_chars": 1200,
  "response_chars": 800,
  "latency_ms": 1543,
  "ok": true,
  "error": null,
  "meta": {
    "promptVersion": "idea-v1",
    "inputPayload": {
      "tone": "light",
      "realism": 40
    },
    "usage": {
      "input_tokens": 450,
      "output_tokens": 300,
      "total_tokens": 750
    }
  }
}
```

**Response Body** `200 OK`

```json
{ "ok": true }
```

> **백엔드 권장 처리:**
> - `prompt_hash` / `response_hash` (SHA-256) 계산 후 DB 저장
> - 100KB 초과 시 truncate 처리
> - `stage` 값: `"idea"` | `"acts"` | `"blocks_overview"` | `"block_detail"` | `"block_overview_regenerate"` | `"block_overview_expand"`

---

### 3-2. 분석 이벤트 로그

```
POST /api/v1/logs/event
```

**Request Body**

```json
{
  "id": "uuid-v4",
  "ts": 1700000000000,
  "name": "idea_generate_clicked",
  "anonId": "anon_abc123",
  "sessionId": "sess_xyz789",
  "userId": null,
  "projectId": null,
  "meta": {
    "tone": "light",
    "realism": 40,
    "selectedOptionsCount": 7,
    "seed": 1234567890
  },
  "appVersion": "1.0.0",
  "route": "/"
}
```

**Response Body** `200 OK`

```json
{ "ok": true }
```

> **`name` 허용 값 (EventName):**
> `"idea_generate_clicked"` | `"idea_generated"` | `"idea_candidate_selected"` |
> `"acts_generate_clicked"` | `"acts_generated"` | `"blocks_overview_generated"` |
> `"block_opened"` | `"block_detail_generate_clicked"` | `"block_detail_generated"` |
> `"block_detail_expanded"` | `"block_variant_selected"` | `"quota_exceeded"` | `"cooldown_blocked"`

---

## 4. Pydantic 모델 (전체)

아래는 FastAPI 백엔드에서 사용할 Pydantic v2 모델 예시입니다.

```python
# models.py

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────
# 공통 타입
# ──────────────────────────────────────────

ToneKey = Literal["light", "hard", "bleak"]
ActKey = Literal["setup", "progress", "crisis", "climax", "resolution"]
ExpandPreset = Literal[
    "more_specific", "raise_stakes", "add_emotion", "add_twist", "add_dialogue"
]
VariantSource = Literal["initial", "regenerate", "expand", "generated", "expanded"]
BlockIndex = Literal[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]


# ──────────────────────────────────────────
# IdeaState
# ──────────────────────────────────────────

class IdeaState(BaseModel):
    seed: int
    tone: ToneKey
    realism: Optional[int] = None
    world: Optional[dict[str, str]] = None
    character: Optional[dict[str, str]] = None
    plot: Optional[dict[str, str]] = None
    motifs_ranked: Optional[list[str]] = None


# ──────────────────────────────────────────
# Idea
# ──────────────────────────────────────────

class IdeaFormState(BaseModel):
    tone: ToneKey
    realism: int = 50
    seed: Optional[int] = None
    world_setting: Optional[str] = None
    world_era: Optional[str] = None
    world_scale: Optional[str] = None
    character_protagonist: Optional[str] = None
    character_count: Optional[str] = None
    character_relationship: Optional[str] = None
    plot_structure: Optional[str] = None
    plot_conflict: Optional[str] = None
    plot_ending: Optional[str] = None
    motifs_ranked: Optional[list[str]] = None

class GenerateIdeaRequest(BaseModel):
    form: IdeaFormState
    compacted_payload: dict

class IdeaCandidate(BaseModel):
    logline: str
    synopsis: str
    tags: list[str]

class IdeaResult(BaseModel):
    candidates: list[IdeaCandidate]
    state: IdeaState


# ──────────────────────────────────────────
# Acts
# ──────────────────────────────────────────

class GenerateActsRequest(BaseModel):
    logline: str
    synopsis: str
    state: IdeaState

class Act(BaseModel):
    key: ActKey
    title: str
    summary: str

class ActsResult(BaseModel):
    acts: list[Act]
    state: IdeaState


# ──────────────────────────────────────────
# Blocks
# ──────────────────────────────────────────

class BlockSpec(BaseModel):
    index: BlockIndex
    act: Literal[1, 2, 3, 4]
    title: str
    purpose: str
    required: Optional[str] = None
    deliver: Optional[str] = None

class BlockOverviewVariant(BaseModel):
    id: str
    created_at: int = Field(alias="createdAt")
    source: VariantSource
    headline: str
    hooks: list[str]
    stakes: Optional[str] = None
    tags: Optional[list[str]] = None
    note: Optional[str] = None

    class Config:
        populate_by_name = True

class BlockDetailVariant(BaseModel):
    id: str
    created_at: int = Field(alias="createdAt")
    source: VariantSource
    beat: str
    micro_hooks: Optional[list[str]] = Field(None, alias="microHooks")
    preset: Optional[ExpandPreset] = None

    class Config:
        populate_by_name = True

class BlockNode(BaseModel):
    index: BlockIndex
    overview_variants: list[BlockOverviewVariant] = Field(alias="overviewVariants")
    selected_overview_id: str = Field(alias="selectedOverviewId")
    detail_variants: list[BlockDetailVariant] = Field(alias="detailVariants")
    selected_detail_id: Optional[str] = Field(None, alias="selectedDetailId")

    class Config:
        populate_by_name = True

class BlocksMemory(BaseModel):
    protagonist_goal: Optional[str] = Field(None, alias="protagonistGoal")
    central_conflict: Optional[str] = Field(None, alias="centralConflict")
    b_story: Optional[str] = Field(None, alias="bStory")
    progress_flags: list[str] = Field(default_factory=list, alias="progressFlags")
    last_hooks: Optional[list[str]] = Field(None, alias="lastHooks")

    class Config:
        populate_by_name = True

class BlocksDraft(BaseModel):
    specs: list[BlockSpec]
    blocks_by_index: dict[str, BlockNode] = Field(alias="blocksByIndex")
    memory: BlocksMemory

    class Config:
        populate_by_name = True

class GenerateBlocksOverviewRequest(BaseModel):
    logline: str
    synopsis: str
    tags: list[str]
    state: IdeaState
    acts: Optional[ActsResult] = None

class GenerateBlockDetailRequest(BaseModel):
    block_index: BlockIndex
    spec: BlockSpec
    overview: BlockOverviewVariant
    state: IdeaState
    memory: BlocksMemory
    preset: Optional[ExpandPreset] = None
    sentence_range: Optional[dict[str, int]] = None

class RegenerateOverviewRequest(BaseModel):
    block_index: BlockIndex
    spec: BlockSpec
    current_overview: BlockOverviewVariant
    state: IdeaState
    memory: BlocksMemory

class ExpandOverviewRequest(BaseModel):
    block_index: BlockIndex
    spec: BlockSpec
    current_overview: BlockOverviewVariant
    preset: ExpandPreset
    state: IdeaState
    memory: BlocksMemory


# ──────────────────────────────────────────
# Logging
# ──────────────────────────────────────────

class LogAICallRequest(BaseModel):
    anon_id: str
    session_id: str
    stage: str
    mode: Literal["mock", "server"]
    model: Optional[str] = None
    prompt: str
    response: str
    prompt_chars: Optional[int] = None
    response_chars: Optional[int] = None
    latency_ms: Optional[int] = None
    ok: bool = True
    error: Optional[str] = None
    meta: Optional[dict] = None

class LogEventRequest(BaseModel):
    id: str
    ts: int
    name: str
    anon_id: str = Field(alias="anonId")
    session_id: str = Field(alias="sessionId")
    user_id: Optional[str] = Field(None, alias="userId")
    project_id: Optional[str] = Field(None, alias="projectId")
    meta: Optional[dict] = None
    app_version: Optional[str] = Field(None, alias="appVersion")
    route: Optional[str] = None

    class Config:
        populate_by_name = True
```

---

## 5. CORS 설정

프론트엔드(`http://localhost:3000`)에서 요청하므로 반드시 CORS를 허용해야 합니다.

```python
# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Story-Forge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # 로컬 개발
        "https://story-forge.example.com", # 프로덕션 도메인
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)
```

---

## 6. 에러 응답 형식

FastAPI 기본 에러 형식(`detail` 필드)을 그대로 사용하면 됩니다.
프론트엔드의 `apiClient.ts`는 `detail` 또는 `error` 필드를 읽어 에러 메시지를 추출합니다.

```json
// 400 Bad Request
{
  "detail": "Missing required field: logline"
}

// 422 Unprocessable Entity (Pydantic 검증 실패)
{
  "detail": [
    {
      "loc": ["body", "tone"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}

// 500 Internal Server Error
{
  "detail": "LLM API call failed: rate limit exceeded"
}
```

---

## 7. 엔드포인트 요약표

| Method | Path | 기능 | 소비 시간 (참고) |
|--------|------|------|-----------------|
| `POST` | `/api/v1/story/idea` | 아이디어 후보 2개 생성 | ~3-5초 |
| `POST` | `/api/v1/story/acts` | 5막 구조 생성 | ~2-4초 |
| `POST` | `/api/v1/story/blocks/overview` | 24블록 개요 생성 | ~5-10초 |
| `POST` | `/api/v1/story/blocks/detail` | 블록 상세 생성 | ~2-3초 |
| `POST` | `/api/v1/story/blocks/regenerate-overview` | 블록 개요 재생성 | ~2-3초 |
| `POST` | `/api/v1/story/blocks/expand-overview` | 블록 개요 확장 | ~2-3초 |
| `POST` | `/api/v1/logs/ai-call` | AI 호출 로그 저장 | best-effort |
| `POST` | `/api/v1/logs/event` | 분석 이벤트 저장 | best-effort |
