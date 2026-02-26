# Story-Forge FastAPI 백엔드 API 명세

> 이 문서는 FastAPI + LangGraph 백엔드 개발자가 구현해야 할 엔드포인트와 Pydantic 모델을 정의합니다.
> 프론트엔드(`src/lib/api/storyApi.ts`)는 아래 명세에 맞춰 요청을 보냅니다.

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [Projects API](#2-projects-api)
3. [Story Generation API](#3-story-generation-api)
4. [Logging API](#4-logging-api)
5. [Pydantic 모델 (전체)](#5-pydantic-모델-전체)
6. [CORS 설정](#6-cors-설정)
7. [에러 응답 형식](#7-에러-응답-형식)

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

## 2. Projects API

### 2-1. 밀도 옵션 목록 조회

```
GET /api/v1/projects/density-options
```

**[창작 흐름 변경]** 이 엔드포인트는 아이디어 확정 직후 — 막 구조 생성 전에 — 호출됩니다.
사용자가 SelectionPanel에서 구조(간략/표준/상세)를 선택하면, 선택된 `actCount`와 `densityId`가
막 구조 생성(`POST /acts`) 및 블록 생성(`POST /blocks/overview`)에 모두 전달됩니다.

**Request**
- Body: 없음
- Headers: `X-Anon-Id`, `X-Session-Id` (공통 헤더)

**Response Body** `200 OK`

```json
{
  "options": [
    {
      "id": "compact",
      "label": "간략 (15블록)",
      "description": "3막 구조, 블록 15개. 핵심 장면만 구성합니다.",
      "blockCount": 15,
      "actCount": 3
    },
    {
      "id": "standard",
      "label": "표준 (24블록)",
      "description": "4막 구조, 블록 24개. 균형잡힌 기본 구성입니다.",
      "blockCount": 24,
      "actCount": 4
    },
    {
      "id": "detailed",
      "label": "상세 (30블록)",
      "description": "5막 구조, 블록 30개. 세밀하게 장면을 분할합니다.",
      "blockCount": 30,
      "actCount": 5
    }
  ],
  "default_id": "standard"
}
```

> **백엔드 구현 참고:**
> - `options`는 서버가 지원하는 밀도 옵션 목록입니다. 추가/제거 가능합니다.
> - `default_id`는 프론트엔드가 초기 선택값으로 사용합니다.
> - 각 `id`는 `POST /api/v1/story/blocks/overview`의 `density_id`로 전달됩니다.

---

## 3. Story Generation API

### 3-1. 아이디어 생성

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

### 3-2. 막 구조 생성 (가변 actCount)

```
POST /api/v1/story/acts
```

> **[리팩토링]** `act_count` 파라미터 추가.
> 사용자가 SelectionPanel에서 선택한 밀도(`compact=3막 / standard=4막 / detailed=5막`)에 따라
> 서버가 해당 막 수에 맞는 구조를 생성합니다.

**Request Body**

```json
{
  "logline": "선택된 로그라인 텍스트",
  "synopsis": "선택된 시놉시스 텍스트",
  "act_count": 4,
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

> `act_count` 허용값: `3` (간략), `4` (표준), `5` (상세). 기본값 `5`.
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

### 3-3. 블록 개요 생성 (가변 밀도)

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
  "density_id": "standard",
  "acts": {
    "acts": [ /* Act[] — 5막 결과, 선택사항 */ ],
    "state": { /* IdeaState */ }
  }
}
```

> `density_id`는 `GET /api/v1/projects/density-options`에서 받은 `option.id` 값입니다.
> 백엔드는 이 값을 기반으로 몇 막/몇 블록의 스펙을 생성할지 결정합니다.

**Response Body** `200 OK`

```json
{
  "densityId": "standard",
  "totalActs": 4,
  "specs": [
    {
      "index": 1,
      "actIndex": 1,
      "title": "일상의 균열",
      "purpose": "주인공의 평범한 일상을 보여주고 핵심 결핍을 암시한다",
      "required": "주인공 소개",
      "deliver": "관객의 공감 형성"
    }
    /* ... blockCount개 (density에 따라 가변) */
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
    /* ... blockCount개 키 (density에 따라 가변) */
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

> **`BlockSpec` 변경 사항:** `act: 1|2|3|4` → `actIndex: number` (1-based, 막 수에 따라 가변)

---

### 3-4. 블록 상세 생성 (기본 / 확장 공통)

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

### 3-5. 블록 개요 재생성 (일반 / 브랜치 공통)

```
POST /api/v1/story/blocks/regenerate-overview
```

**브랜치 노드 ID 체계**

AI 재생성/확장으로 생성된 대안 시나리오는 "브랜치 노드"로 캔버스 우측에 배치됩니다.

| 필드 | 형식 | 설명 |
|------|------|------|
| React Flow 노드 ID | `block-{N}-branch-{suffix}` | `suffix`: A, B, C, ..., Z, AA, AB, ... |
| branch_id (API) | `#N-{suffix}` | 예: `#7-A`, `#7-B`, `#12-AA` |

예시:
- `#7-A` — 블록 7의 첫 번째 대안 시나리오
- `#7-B` — 블록 7의 두 번째 대안 시나리오
- `#12-AA` — 블록 12의 27번째 대안 시나리오

캔버스 레이아웃:
- 메인 트렁크: X=0, Y 증가 방향으로 배치
- 브랜치: 같은 Y, X += 260px씩 우측으로 배치
- 트렁크 ↔ 브랜치 연결: Bezier 점선 엣지 (`--`), 에지 레이블에 branch_id 표시

**Request Body**

```json
{
  "block_index": 3,
  "spec": { /* BlockSpec */ },
  "current_overview": { /* BlockOverviewVariant — 현재 선택된 것 */ },
  "state": { /* IdeaState */ },
  "memory": { /* BlocksMemory */ },
  "branch_id": "#3-A"
}
```

> `branch_id`는 **브랜치 재생성 시에만** 포함됩니다. 일반 재생성 시 생략합니다.
> 백엔드는 `branch_id`가 있으면 "대안 시나리오" 로그 태깅에 활용할 수 있습니다.

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

### 3-5-1. 캔버스 인터랙션 명세

> 이 섹션은 프론트엔드 인터랙션 구현 명세입니다. 백엔드 구현에는 영향이 없습니다.

**노드 선택 (Inspector 연동)**
- 사용자가 노드를 클릭하면 `selectedNodeId` 업데이트
- 우측 `InspectorPanel`에 해당 노드의 상세 정보 즉시 로드
- 선택된 노드: 파란 Outline (`ring-2 ring-blue-500`) 강조
- 캔버스 빈 공간 클릭 시 선택 해제

**인라인 편집**
- 헤드라인 더블클릭 → `<textarea>` 전환 → Enter(저장) / Escape(취소) / Blur(저장)
- 훅 더블클릭 → `<input>` 전환 → 빈값 저장 시 훅 삭제
- Inspector 패널에서도 동일한 편집 가능
- 변경사항 즉시 `blocksByIndex` 반영 (optimistic update)

**드래그 앤 드롭 퍼시스턴스**
- `onNodesChange` → `dragging=false` position 변경 감지
- `draft.nodePositions: Record<nodeId, {x, y}>` 저장
- 다음 레이아웃 계산 시 `nodePositions`가 기본 좌표보다 우선 적용

**브랜치 생성 흐름**
1. 노드 hover → 🔄 버튼 클릭
2. `onRegenerateOverview(blockIndex)` 호출
3. AI가 새 variant 반환 → `blocksByIndex[index].overviewVariants` 추가
4. 새 variant는 자동으로 브랜치 노드(X 우측)로 렌더링
5. 트렁크 ↔ 브랜치 Bezier 점선 엣지 자동 생성

---

### 3-6. 블록 개요 확장 (프리셋 적용)

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

## 4. Logging API

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

## 5. Pydantic 모델 (전체)

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
BlockIndex = int  # 동적 밀도 지원: 가변 블록 수


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

class DensityOption(BaseModel):
    id: str
    label: str
    description: str
    block_count: int = Field(alias="blockCount")
    act_count: int = Field(alias="actCount")

    class Config:
        populate_by_name = True

class DensityOptionsResponse(BaseModel):
    options: list[DensityOption]
    default_id: str

class BlockSpec(BaseModel):
    index: BlockIndex
    act_index: int = Field(alias="actIndex")  # 1-based, 막 수에 따라 가변
    title: str
    purpose: str
    required: Optional[str] = None
    deliver: Optional[str] = None

    class Config:
        populate_by_name = True

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
    density_id: str = Field(alias="densityId")
    total_acts: int = Field(alias="totalActs")
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
    density_id: str  # GET /density-options 에서 받은 option.id
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

## 6. CORS 설정

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

## 7. 에러 응답 형식

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

## 8. 엔드포인트 요약표

| Method | Path | 기능 | 소비 시간 (참고) |
|--------|------|------|-----------------|
| `GET`  | `/api/v1/projects/density-options` | 밀도 옵션 목록 조회 | ~50ms |
| `POST` | `/api/v1/story/idea` | 아이디어 후보 2개 생성 | ~3-5초 |
| `POST` | `/api/v1/story/acts` | 5막 구조 생성 | ~2-4초 |
| `POST` | `/api/v1/story/blocks/overview` | 가변 블록 개요 생성 | ~5-10초 |
| `POST` | `/api/v1/story/blocks/detail` | 블록 상세 생성 | ~2-3초 |
| `POST` | `/api/v1/story/blocks/regenerate-overview` | 블록 개요 재생성 | ~2-3초 |
| `POST` | `/api/v1/story/blocks/expand-overview` | 블록 개요 확장 | ~2-3초 |
| `POST` | `/api/v1/logs/ai-call` | AI 호출 로그 저장 | best-effort |
| `POST` | `/api/v1/logs/event` | 분석 이벤트 저장 | best-effort |
