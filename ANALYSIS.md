# Story-Forge 프로젝트 분석 문서

> 실제 코드 기반 심층 분석 (2026-02-22 기준)
> 실제 구현된 코드를 직접 분석한 문서입니다. README의 설계 의도와 다른 부분도 명시합니다.

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [UI 구성](#3-ui-구성)
4. [사용자 플로우](#4-사용자-플로우)
5. [AI 사용 지점 (상세)](#5-ai-사용-지점-상세)
6. [상태 관리](#6-상태-관리)
7. [API 라우트 & 데이터 플로우](#7-api-라우트--데이터-플로우)
8. [데이터베이스 스키마](#8-데이터베이스-스키마)
9. [분석 & 이벤트 추적](#9-분석--이벤트-추적)
10. [주요 기능 정리](#10-주요-기능-정리)

---

## 1. 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.1 |
| 언어 | TypeScript | 5.9.3 |
| UI | React | 19.2.3 |
| 스타일링 | Tailwind CSS | 4.1.18 |
| 아이콘 | Lucide React | 0.562.0 |
| 데이터베이스 | Supabase (PostgreSQL) | 2.89.0 |
| CSS 유틸리티 | clsx + tailwind-merge | - |
| UI 변형 | class-variance-authority | - |

**현재 AI 모드: Mock (실제 LLM API 미연결)**
- 모든 AI 생성은 `mockAiClient.ts`, `mockActsClient.ts`, `mockBlocksClient.ts`의 seed 기반 템플릿 시스템으로 동작
- 실제 Anthropic/OpenAI API 연결 코드는 준비되어 있으나 현재 `mode: 'mock'`으로 고정

---

## 2. 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 + 메타데이터
│   ├── page.tsx                      # 메인 페이지 (700줄) - 전역 상태 머신
│   └── api/
│       ├── ai-calls/route.ts         # AI 호출 로그 저장 (POST/GET)
│       ├── events/route.ts           # 분석 이벤트 저장 (POST/GET)
│       └── events/link/route.ts      # 이벤트 링크 (stub)
│
├── components/
│   ├── ui/                           # 기본 UI 프리미티브
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   └── slider.tsx
│   ├── InputPanel.tsx                # Step 1: 아이디어 입력 폼
│   ├── OutputPanel.tsx               # Step 2: 후보 비교
│   ├── ActsPanel.tsx                 # Step 3: 5막 구조
│   ├── BlocksPanel.tsx               # Step 4: 24블록 에디터 (BlockCard 포함)
│   ├── BlockDetailModal.tsx          # Step 4 모달: 블록 상세 편집
│   ├── AppHeader.tsx                 # 헤더 + Stepper 네비게이션
│   ├── Stepper.tsx                   # 단계 표시기
│   ├── PageShell.tsx                 # 페이지 래퍼
│   ├── OptionSelect.tsx              # 드롭다운 선택기
│   ├── Chip.tsx                      # 태그/배지 컴포넌트
│   ├── AuthPanel.tsx                 # 인증 패널 (stub)
│   └── AnalyticsDebugPanel.tsx       # 디버그 패널
│
├── config/
│   ├── policy.ts                     # 생성 정책 (할당량, 쿨다운)
│   └── telemetry.ts                  # 텔레메트리 설정 (stub)
│
├── data/
│   ├── options.ts                    # 옵션 정의 (세계관, 캐릭터, 플롯, 모티프)
│   └── blockSpecs.ts                 # 24블록 고정 템플릿 스펙
│
├── hooks/                            # 커스텀 React 훅
│
├── lib/
│   ├── aiClient.ts                   # 아이디어 생성 클라이언트
│   ├── actsClient.ts                 # 5막 생성 클라이언트
│   ├── blocksClient.ts               # 24블록 생성 클라이언트 (4개 함수)
│   ├── mockAiClient.ts               # 아이디어 Mock 구현 (500줄+)
│   ├── mockActsClient.ts             # 5막 Mock 구현
│   ├── mockBlocksClient.ts           # 블록 Mock 구현
│   ├── prompts/                      # 버전 관리된 프롬프트 빌더
│   │   ├── ideaPrompt.ts
│   │   ├── actsPrompt.ts
│   │   ├── blocksOverviewPrompt.ts
│   │   ├── blockDetailPrompt.ts
│   │   ├── blocksRegenerateOverviewPrompt.ts
│   │   ├── blocksExpandOverviewPrompt.ts
│   │   ├── blockDetailExpandPrompt.ts
│   │   └── index.ts
│   ├── identity.ts                   # anonId / sessionId 관리
│   ├── track.ts                      # 분석 이벤트 트래킹
│   ├── logAI.ts                      # AI 호출 로깅
│   ├── supabaseClient.ts             # 브라우저용 Supabase 클라이언트
│   ├── random.ts                     # Seed 기반 난수 생성기
│   └── utils.ts                      # 공통 유틸
│
├── server/
│   ├── eventStore.ts                 # EventStore 인터페이스 + 구현체 2개
│   └── supabaseAdmin.ts              # 서버용 Supabase 클라이언트 (Service Role)
│
└── types/
    ├── index.ts                      # 타입 중앙 export + 데이터 플로우 문서
    ├── options.ts                    # OptionGroup, Option, ToneKey
    ├── form.ts                       # IdeaFormState, CompactedFormPayload
    ├── idea.ts                       # IdeaCandidate, IdeaState, IdeaResult
    ├── acts.ts                       # Act, ActKey, ActsResult
    ├── blocks.ts                     # BlockSpec, BlockNode, BlocksDraft
    ├── events.ts                     # EventName, EventRecord
    └── ai.ts                         # UsageMeta
```

---

## 3. UI 구성

### 3.1 컴포넌트 계층

```
app/page.tsx (상태 머신 + 핸들러)
│
├── AppHeader
│   └── Stepper (현재 단계 강조 표시)
│
├── [viewState에 따라 하나만 렌더링]
│   │
│   ├── InputPanel          (viewState: 'input' | 'loading')
│   │   ├── OptionSelect × 9 (세계관 3 + 캐릭터 3 + 플롯 3)
│   │   ├── Slider (리얼리즘 0-100)
│   │   └── Chip (모티프 태그, 드래그 정렬)
│   │
│   ├── OutputPanel         (viewState: 'output' | 'confirmed')
│   │   └── 후보 카드 × 2 (로그라인, 시놉시스, 태그)
│   │
│   ├── ActsPanel           (viewState: 'acts' | 'acts_loading')
│   │   └── 막 카드 × 5 (5열 그리드)
│   │
│   └── BlocksPanel         (viewState: 'blocks' | 'blocks_loading')
│       ├── BlockCard × 24  (호버 시 액션 버튼 표시)
│       └── BlockDetailModal (블록 클릭 시 열림)
│           └── 변형 탭 (오버뷰 / 상세)
│
└── AnalyticsDebugPanel     (디버그용, 개발 중에만 노출)
```

### 3.2 화면별 레이아웃

| 화면 | 레이아웃 | 주요 요소 |
|------|---------|----------|
| InputPanel | 2열 (옵션 그룹 / 모티프 선택) | 톤 선택, 리얼리즘 슬라이더, 9개 드롭다운, 모티프 우선순위 |
| OutputPanel | 2열 나란히 카드 | 로그라인, 시놉시스, 자동 태그, "이 아이디어 선택" 버튼 |
| ActsPanel | 5열 그리드 | 막 제목 + 요약 카드 |
| BlocksPanel | 4열 그리드 (막당 6블록) | 블록 카드 (헤드라인, 후크, 변형 수), 호버 액션 |
| BlockDetailModal | 전체화면 모달 | 오버뷰 변형 탭, 상세 변형 탭, 확장 프리셋 버튼 |

### 3.3 UI 컴포넌트 스펙

**AppHeader**
- 워드마크 "story-forge" 로고
- Stepper: Idea → Compare → 5 Acts → 24 Blocks → Write (5단계)
- 현재 단계 강조 표시

**BlockCard** (BlocksPanel 내부 인라인 컴포넌트)
- 블록 번호, 막 번호, 제목
- 헤드라인 (현재 선택된 오버뷰 변형)
- 후크 미리보기 (2-3줄)
- 변형 개수 배지
- 호버 시: 재생성 / 확장 / 상세보기 버튼 표시

**BlockDetailModal**
- 탭 1: 오버뷰 변형 목록 (생성 시간, 소스 표시)
- 탭 2: 상세 변형 목록 (최대 3개)
- 확장 프리셋 버튼 5종
- 세션 할당량 표시 (남은 상세 생성 횟수)

---

## 4. 사용자 플로우

```
┌────────────────────────────────────────────────────────┐
│  STEP 1: 아이디어 입력 (InputPanel)                     │
│                                                        │
│  톤 선택: light / hard / bleak                          │
│  리얼리즘 슬라이더: 0(판타지) ─────── 100(극사실주의)    │
│  옵션 9종:                                             │
│    세계관: 배경 설정 / 시대 / 규모                       │
│    캐릭터: 주인공 유형 / 인물 수 / 관계                   │
│    플롯: 구조 / 갈등 / 결말                              │
│  모티프 우선순위 정렬                                     │
│  → "로그라인 2개 생성" 버튼 클릭                         │
│                                                        │
│  [AI 호출 1] generateIdea() ← 여기서 Mock AI 호출      │
└───────────────────────┬────────────────────────────────┘
                        │ (500ms 지연 후 결과)
                        ▼
┌────────────────────────────────────────────────────────┐
│  STEP 2: 후보 비교 (OutputPanel)                        │
│                                                        │
│  후보 A                    후보 B                       │
│  ┌──────────────┐         ┌──────────────┐            │
│  │ 로그라인      │         │ 로그라인      │            │
│  │ 시놉시스      │         │ 시놉시스      │            │
│  │ #태그 #태그   │         │ #태그 #태그   │            │
│  │ [이 아이디어] │         │ [이 아이디어] │            │
│  └──────────────┘         └──────────────┘            │
│                                                        │
│  → "이 아이디어 선택" 클릭 → 다음 단계                  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  STEP 3: 5막 구조 (ActsPanel)                           │
│                                                        │
│  Setup | Progress | Crisis | Climax | Resolution       │
│  ┌───┐   ┌───┐     ┌───┐    ┌───┐    ┌───┐           │
│  │1막│   │2막│     │3막│    │4막│    │5막│           │
│  │제목│   │제목│     │제목│    │제목│    │제목│          │
│  │요약│   │요약│     │요약│    │요약│    │요약│          │
│  └───┘   └───┘     └───┘    └───┘    └───┘           │
│                                                        │
│  [AI 호출 2] generateActs() ← 여기서 Mock AI 호출      │
│  → "24블록으로 진행" 버튼 클릭                          │
└───────────────────────┬────────────────────────────────┘
                        │ (1200ms 지연 후 결과)
                        ▼
┌────────────────────────────────────────────────────────┐
│  STEP 4: 24블록 구조 (BlocksPanel)                      │
│                                                        │
│  Act 1 (1-6) | Act 2 (7-12) | Act 3 (13-18) | Act 4 (19-24)
│  ┌──┐┌──┐┌──┐  ┌──┐┌──┐┌──┐  ┌──┐┌──┐┌──┐  ┌──┐┌──┐┌──┐
│  │  ││  ││  │  │  ││  ││  │  │  ││  ││  │  │  ││  ││  │
│  └──┘└──┘└──┘  └──┘└──┘└──┘  └──┘└──┘└──┘  └──┘└──┘└──┘
│                                                        │
│  [AI 호출 3] generateBlocksOverview() ← Mock AI       │
│                                                        │
│  블록 호버 시:                                          │
│    [재생성] [확장▼] [상세보기]                          │
│  블록 클릭 시: BlockDetailModal 열림                    │
│                                                        │
│  모달 내에서:                                            │
│    [AI 호출 4] generateBlockDetail()   ← Mock AI      │
│    [AI 호출 5] regenerateOverview()    ← Mock AI      │
│    [AI 호출 6] expandOverview()        ← Mock AI      │
└────────────────────────────────────────────────────────┘
```

### 4.1 뒤로 가기 / 재시작

- 각 단계에서 이전 단계로 돌아갈 수 있는 백 버튼 제공
- "처음부터 다시" 버튼으로 InputPanel로 복귀 가능
- 폼 상태는 localStorage에 저장되어 새로고침 후에도 유지

### 4.2 상태 전환 다이어그램

```
input ──[generate 클릭]──→ loading ──[결과 수신]──→ output
  ↑                                                   │
  └──────────[재시작]─────────────────────────────────┤
                                                      │[후보 선택]
                                                      ↓
                                              confirmed
                                                      │[5막 진행]
                                                      ↓
                                            acts_loading ──→ acts
                                                               │[24블록 진행]
                                                               ↓
                                                    blocks_loading ──→ blocks
```

---

## 5. AI 사용 지점 (상세)

> **현재 모든 AI 호출은 Mock 모드** (`mode: 'mock'`)로 실행됩니다.
> 실제 LLM 호출 인프라(프롬프트 빌더, 로깅 시스템)는 완전히 구현되어 있습니다.

### 5.1 AI 호출 전체 지도

| # | 함수 | 파일 | 입력 | 출력 | 지연 | 프롬프트 버전 |
|---|------|------|------|------|------|--------------|
| 1 | `generateIdea()` | `lib/aiClient.ts` | 폼 상태 (톤, 리얼리즘, 9개 옵션, 모티프) | IdeaResult (후보 2개) | 500ms | `idea-v1` |
| 2 | `generateActs()` | `lib/actsClient.ts` | 로그라인 + 시놉시스 + 톤 | ActsResult (5막) | 800ms | `acts-v1` |
| 3 | `generateBlocksOverview()` | `lib/blocksClient.ts` | 로그라인 + 5막 (선택) | BlocksDraft (24블록 개요) | 1200ms | `blocks-overview-v1` |
| 4 | `generateBlockDetail()` | `lib/blocksClient.ts` | 블록 인덱스 + 개요 + 프리셋 | 상세 비트 텍스트 | 600ms | `block-detail-v1` |
| 5 | `regenerateOverview()` | `lib/blocksClient.ts` | 현재 개요 + 상태 | 새 개요 변형 | 500ms | `blocks-regen-v1` |
| 6 | `expandOverview()` | `lib/blocksClient.ts` | 현재 개요 + 확장 프리셋 | 강화된 개요 변형 | 500ms | `blocks-expand-v1` |

### 5.2 프롬프트 빌더 시스템 (`lib/prompts/`)

각 AI 호출마다 전용 프롬프트 빌더 함수가 있으며, **버전 상수**를 함께 export합니다.

```
lib/prompts/
├── ideaPrompt.ts                → buildIdeaPrompt()        / IDEA_PROMPT_VERSION = "idea-v1"
├── actsPrompt.ts                → buildActsPrompt()        / ACTS_PROMPT_VERSION = "acts-v1"
├── blocksOverviewPrompt.ts      → buildBlocksOverviewPrompt() / "blocks-overview-v1"
├── blockDetailPrompt.ts         → buildBlockDetailPrompt() / "block-detail-v1"
├── blocksRegenerateOverviewPrompt.ts → buildBlocksRegenerateOverviewPrompt() / "blocks-regen-v1"
├── blocksExpandOverviewPrompt.ts     → buildBlocksExpandOverviewPrompt()    / "blocks-expand-v1"
└── blockDetailExpandPrompt.ts        → buildBlockDetailExpandPrompt()       / "block-detail-expand-v1"
```

**프롬프트 구조 설계 (캐시 친화적)**
```
[SYSTEM 섹션 - 안정적, 캐시 가능]
  - AI 역할 정의
  - 출력 형식 (JSON 스키마)
  - 규칙 (한국어 출력, 2개 후보 생성 등)

[USER 섹션 - 동적, 사용자 입력]
  - 톤: light/hard/bleak
  - 리얼리즘: 0-100
  - 선택된 옵션들 (JSON)
  - 모티프 순서
```

### 5.3 Mock AI 시스템 (`lib/mockAiClient.ts`)

현재 실제 LLM 대신 **Seed 기반 결정론적 생성기**를 사용합니다.

**특징:**
- 동일 Seed → 동일 출력 (재현 가능)
- 템플릿 기반 텍스트 생성 (6종 목표형 + 6종 관계형 로그라인 템플릿)
- 가중치 기반 랜덤 선택 (`random.ts`의 `weightedRandom()`)
- 선택된 옵션에서 자동 태그 생성

**시놉시스 생성 공식 (6부분 구조):**
```
배경 설정 → 발단 사건 → 목표 → 갈등 → 반전/긴장 → 톤별 결말
```

### 5.4 AI 로깅 시스템 (`lib/logAI.ts`)

모든 AI 호출(Mock 포함)을 서버에 기록합니다.

```typescript
// 로깅되는 필드
{
  anonId: string;           // 익명 사용자 ID
  sessionId: string;        // 세션 ID
  stage: "idea" | "acts" | "blocks_overview" | "block_detail" | ...;
  mode: "mock" | "server";  // 현재는 항상 "mock"
  model?: string;           // 실제 LLM 사용 시 모델명
  prompt: string;           // 실제 프롬프트 전문
  response: string;         // 실제 응답 전문
  latencyMs: number;        // 소요 시간
  ok: boolean;              // 성공 여부
  meta: {
    promptVersion: string;  // 예: "idea-v1"
    inputPayload: {...};    // 입력 데이터 요약
    usage?: { input_tokens, output_tokens, total_tokens };
  };
}
```

**전송 경로:** `POST /api/ai-calls` → Supabase `ai_calls` 테이블 (또는 파일)

**안전 장치:**
- 실패해도 앱 동작에 영향 없음 (best-effort)
- 실패 시 1초 후 1회 재시도
- 100KB 초과 시 자동 truncate

### 5.5 확장 프리셋 (5종)

블록 오버뷰/상세를 특정 방향으로 강화하는 옵션:

| 프리셋 키 | 한국어 의미 | 설명 |
|-----------|------------|------|
| `more_specific` | 더 구체적으로 | 추상적 내용을 구체화 |
| `raise_stakes` | 긴장감 높이기 | 위험/결과 강화 |
| `add_emotion` | 감정 깊이 추가 | 감정적 리얼리티 강화 |
| `add_twist` | 반전 추가 | 예상치 못한 전환 |
| `add_dialogue` | 대화 추가 | 캐릭터 대화 삽입 |

### 5.6 생성 정책 (`config/policy.ts`)

```typescript
DEFAULT_DETAIL_POLICY = {
  autoDetailOnOpen: false,              // 블록 열 때 자동 생성 안 함
  maxDetailVariantsPerBlock: 3,         // 블록당 상세 변형 최대 3개
  maxDetailGenerationsPerSession: 10,   // 세션당 상세 생성 최대 10회
  actionCooldownMs: 3000,               // 블록 액션 간 3초 쿨다운
  detailSentenceRange: { min: 3, max: 4 }, // 상세 3-4문장
  expandSentenceRange: { min: 6, max: 8 }, // 확장 6-8문장
}
```

---

## 6. 상태 관리

### 6.1 ViewState 머신 (`app/page.tsx`)

```typescript
type ViewState =
  | 'input'          // 폼 입력 화면
  | 'loading'        // 아이디어 생성 중
  | 'output'         // 후보 비교 화면
  | 'confirmed'      // 후보 선택 완료, 다음 단계 대기
  | 'acts_loading'   // 5막 생성 중
  | 'acts'           // 5막 표시 화면
  | 'blocks_loading' // 24블록 생성 중
  | 'blocks'         // 24블록 에디터
```

### 6.2 핵심 상태 변수

```typescript
// 뷰 상태
const [viewState, setViewState] = useState<ViewState>('input');

// 생성 결과
const [result, setResult] = useState<IdeaResult | null>(null);
const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
const [actsResult, setActsResult] = useState<ActsResult | null>(null);
const [blocksDraft, setBlocksDraft] = useState<BlocksDraft | null>(null);

// 할당량 추적
const [detailGenCount, setDetailGenCount] = useState(0);
const [lastActionAtByIndex, setLastActionAtByIndex] = useState<Record<number, number>>({});
```

### 6.3 상태 인터페이스

**BlocksDraft** - 24블록 전체 드래프트
```typescript
interface BlocksDraft {
  specs: BlockSpec[];                      // 24블록 고정 스펙 (blockSpecs.ts)
  blocksByIndex: Record<number, BlockNode>; // 인덱스별 블록 데이터
  memory: { logline, synopsis, tone, realism }; // 컨텍스트 메모리
}
```

**BlockNode** - 개별 블록
```typescript
interface BlockNode {
  overviewVariants: OverviewVariant[];  // 오버뷰 변형 목록 (무제한)
  selectedOverviewId: string | null;    // 선택된 오버뷰 ID
  detailVariants: DetailVariant[];      // 상세 변형 목록 (최대 3개)
  selectedDetailId: string | null;      // 선택된 상세 ID
}
```

**변형 소스 추적**
```typescript
type OverviewVariantSource = "initial" | "regenerate" | "expand";
type DetailVariantSource = "generated" | "expanded";
```

### 6.4 영속성

| 저장소 | 키 | 내용 |
|--------|-------|------|
| localStorage | `story-forge:idea-form` | 입력 폼 상태 전체 |
| localStorage | `story-forge:anon-id` | 익명 사용자 ID (영구) |
| sessionStorage | `story-forge:session-id` | 세션 ID (탭 단위) |

---

## 7. API 라우트 & 데이터 플로우

### 7.1 API 엔드포인트

```
POST /api/ai-calls    → AI 호출 로그 저장 → Supabase ai_calls 테이블
GET  /api/ai-calls    → 최근 AI 호출 조회 (개발용)

POST /api/events      → 분석 이벤트 저장 → Supabase events 테이블 또는 .data/events.jsonl
GET  /api/events      → 최근 이벤트 조회 (개발용)
GET/POST /api/events/link → 이벤트 링크 (미구현 stub)
```

### 7.2 전체 데이터 플로우

```
사용자 액션
    │
    ▼
page.tsx 핸들러
    ├─→ track({ name: 'event_name', meta: {...} })
    │       └─→ POST /api/events
    │               └─→ EventStore.write()
    │                       ├─→ Supabase events 테이블 (환경변수 있을 때)
    │                       └─→ .data/events.jsonl (폴백)
    │
    └─→ generateIdea() / generateActs() / generateBlocksOverview() / ...
            ├─→ Mock 함수 실행 (현재)
            ├─→ buildXPrompt() → 실제 프롬프트 문자열 생성
            └─→ logAI({ stage, prompt, response, latency })
                    └─→ POST /api/ai-calls
                            └─→ Supabase ai_calls 테이블
                                (prompt_hash: SHA-256, truncate at 100KB)
```

### 7.3 EventStore 전략 패턴

```typescript
// server/eventStore.ts
interface EventStore {
  write(event: EventRecord): Promise<void>;
  listRecent(limit: number): Promise<EventRecord[]>;
}

// 환경변수에 따라 자동 선택
export const eventStore =
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? new SupabaseEventStore()   // Supabase PostgreSQL
    : new FileEventStore();      // .data/events.jsonl (JSONL 포맷)
```

---

## 8. 데이터베이스 스키마

### 8.1 `events` 테이블

```sql
id          UUID PRIMARY KEY
ts          TIMESTAMP WITH TIME ZONE
name        TEXT  -- EventName 값
anon_id     TEXT
session_id  TEXT
user_id     TEXT (nullable)
project_id  TEXT (nullable)
route       TEXT (nullable)  -- 현재 URL 경로
app_version TEXT (nullable)
meta        JSONB (nullable) -- 이벤트별 추가 데이터
```

### 8.2 `ai_calls` 테이블

```sql
id              UUID PRIMARY KEY
ts              TIMESTAMP WITH TIME ZONE
anon_id         TEXT
session_id      TEXT
user_id         TEXT (nullable)
project_id      TEXT (nullable)
stage           TEXT  -- idea / acts / blocks_overview / block_detail / ...
mode            TEXT  -- mock / server
model           TEXT (nullable)
prompt          TEXT  -- 실제 프롬프트 전문 (최대 100KB)
response        TEXT  -- 실제 응답 전문 (최대 100KB)
prompt_chars    INTEGER
response_chars  INTEGER
prompt_hash     TEXT  -- SHA-256 해시
response_hash   TEXT  -- SHA-256 해시
latency_ms      INTEGER (nullable)
ok              BOOLEAN
error           TEXT (nullable)
meta            JSONB (nullable)  -- promptVersion, inputPayload, usage
```

### 8.3 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[public-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # 서버 전용, 노출 금지
```

---

## 9. 분석 & 이벤트 추적

### 9.1 추적되는 이벤트 전체 목록

| 이벤트 이름 | 발생 시점 | 주요 메타 |
|-------------|-----------|----------|
| `idea_generate_clicked` | 생성 버튼 클릭 | tone, realism, selectedOptionsCount, seed |
| `idea_generated` | 아이디어 생성 완료 | candidates 수, tags 수 |
| `idea_candidate_selected` | 후보 선택 | candidateIndex |
| `acts_generate_clicked` | 5막 진행 클릭 | - |
| `acts_generated` | 5막 생성 완료 | actCount |
| `blocks_overview_generated` | 24블록 생성 완료 | count (24) |
| `block_opened` | 블록 클릭 | index |
| `block_detail_generate_clicked` | 상세 생성 요청 | index, sentenceRange, detailGenCount |
| `block_detail_generated` | 상세 생성 완료 | index, variantCount |
| `block_detail_expanded` | 상세 확장 완료 | index, preset, sentenceRange |
| `block_variant_selected` | 변형 선택 | index, type (overview\|detail), selectedId |
| `quota_exceeded` | 할당량 초과 | kind, limit, detailGenCount |
| `cooldown_blocked` | 쿨다운 차단 | index, cooldownMs |

### 9.2 익명 신원 시스템 (`lib/identity.ts`)

```
anonId  → localStorage 저장, 브라우저 영구 유지 (사용자 식별)
sessionId → sessionStorage 저장, 탭 단위 (세션 식별)
```

---

## 10. 주요 기능 정리

### 10.1 핵심 기능

1. **다중 파라미터 스토리 설정**
   - 톤 3종, 리얼리즘 슬라이더, 세계관/캐릭터/플롯 각 3종 드롭다운
   - 모티프 우선순위 드래그 정렬
   - Seed 기반 재현 가능한 생성

2. **AI 기반 아이디어 생성 (현재 Mock)**
   - 2개의 차별화된 로그라인 + 시놉시스 + 자동 태그 생성
   - 나란히 비교 후 1개 선택

3. **5막 구조 자동 생성**
   - Setup / Progress / Crisis / Climax / Resolution
   - 선택된 아이디어 컨텍스트 유지

4. **24블록 비트 시트**
   - 고정된 24블록 템플릿 (`data/blockSpecs.ts`)
   - 막당 6블록 × 4막 구조
   - 블록별 헤드라인 + 후크 자동 생성

5. **블록 수준 조작**
   - 오버뷰 재생성 (새 변형 추가)
   - 5종 프리셋으로 오버뷰 확장
   - 상세 비트 생성 (3-4문장)
   - 상세 확장 (6-8문장 + 프리셋)
   - 변형 탭에서 이전/현재 버전 비교 및 전환

6. **생성 정책 & 할당량 관리**
   - 세션당 상세 생성 최대 10회
   - 블록 액션 간 3초 쿨다운
   - 블록당 상세 변형 최대 3개 (초과 시 가장 오래된 것 제거)

7. **폼 자동 저장**
   - InputPanel의 모든 상태를 localStorage에 실시간 저장
   - 새로고침 후에도 폼 복원

8. **완전한 AI 로깅 인프라**
   - 모든 AI 호출(Mock 포함)을 프롬프트 전문과 함께 기록
   - SHA-256 해시로 중복 탐지
   - 프롬프트 버전 추적

---

## README.md와의 차이점

README.md는 **설계 의도와 계획** 중심으로 작성되어 있습니다.
이 문서는 **실제 구현된 코드**를 직접 분석한 결과입니다. 아래는 주요 차이점입니다.

### 구조적 차이 (README 기술 vs 실제 코드)

| 항목 | README.md | 실제 코드 (ANALYSIS.md) |
|------|-----------|------------------------|
| **AI 연결** | Anthropic Claude API 사용 | 현재 Mock 모드 (실제 API 미연결) |
| **파일 구조** | `src/lib/ai/`, `src/lib/analytics/` 등 계층형 | `src/lib/` 직접 (aiClient.ts, mockAiClient.ts 등) |
| **프롬프트 빌더** | `buildCandidatePrompt()` 등 4개 함수명 | `buildIdeaPrompt()`, `buildActsPrompt()` 등 7개 버전별 빌더 |
| **생성 정책** | 세션당 5회 / 2분 쿨다운 | 세션당 10회 / 3초 쿨다운 (실제 config/policy.ts) |
| **24블록 구조** | 막당 1 개요 + 막당 3 비트 (5막 기준 설명) | 4막 × 6블록 = 24블록 고정 (실제 blockSpecs.ts) |
| **5단계 워크플로우** | Idea → Compare → 5 Acts → 24 Blocks → Write | 실제로 Write 단계는 미구현 (stub) |
| **ViewState** | enum 기반으로 설명 | string union type 8종 |
| **데이터 옵션** | `src/data/options/genres.ts` 등 분리 | `src/data/options.ts` 단일 파일 |
| **Supabase 스키마** | `schema.sql` 언급 | 실제 스키마는 코드 내 타입으로만 존재 |

### README가 다루지 않는 실제 구현 내용 (이 문서에서 추가)

- Mock AI 시스템의 구체적 동작 (Seed 기반, 템플릿 공식)
- 프롬프트 버전 관리 시스템 (`IDEA_PROMPT_VERSION = "idea-v1"` 등)
- BlockNode / OverviewVariant / DetailVariant 상세 타입 구조
- 변형 소스 추적 (`initial` / `regenerate` / `expand`)
- logAI() 함수의 안전 장치 (재시도, truncate)
- EventStore 전략 패턴 구현
- AnalyticsDebugPanel 디버그 패널 존재
- 모든 추적 이벤트 명 전체 목록
- 실제 ViewState 8종 목록
- 실제 policy.ts 설정값 (README와 다름)
