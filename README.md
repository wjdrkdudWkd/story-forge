# story-forge

블록 기반 스토리 & 웹소설 아이디어 도구 | Block-based story and web novel ideation tool

AI 기반 서사 생성, 구조화된 아웃라인, 비용 최적화된 확장 기능 제공
AI-powered narrative generation, structured outlining, and cost-optimized expansion

---

## 개요 | Overview

**story-forge**는 작가들이 체계적이고 블록 기반 접근 방식으로 스토리를 브레인스토밍하고 구조화할 수 있도록 돕는 Next.js 기반 도구입니다.

**story-forge** is a Next.js-based tool designed to help writers brainstorm and structure stories using a systematic, block-based approach.

### 워크플로우 | Workflow

1. **Idea Input** - 스토리 파라미터 설정 (톤, 리얼리즘, 장르, 테마, 모티프)
2. **Compare Candidates** - AI 생성 로그라인 2개 비교 및 선택
3. **5-Act Outline** - 고전적인 5막 구조 생성
4. **24-Block Beat Sheet** - 상세한 장면 단위 비트로 확장 (온디맨드 상세 생성)
5. **Write Hub** - 변형 지원과 함께 서사 콘텐츠 관리

### 핵심 철학 | Core Philosophy

이 도구는 **비용 효율성**을 강조합니다:
- 지능형 프롬프트 캐싱
- 정책 기반 상세 생성
- 이벤트 기반 분석

The tool emphasizes **cost efficiency** through intelligent prompt caching, policy-based detail generation, and event-driven analytics.

---

## 주요 기능 | Key Features

### 핵심 스토리 생성 워크플로우 | Core Story Generation Workflow

- **아이디어 생성기 | Idea Generator**: 톤 프리셋, 리얼리즘 슬라이더, 장르/테마/모티프 선택을 통한 다중 파라미터 스토리 설정
- **후보 비교 | Candidate Comparison**: AI 생성 로그라인 2개를 나란히 평가
- **5막 구조 | 5-Act Structure**: Setup → Progress → Crisis → Climax → Resolution 자동 생성
- **24블록 비트 시트 | 24-Block Beat Sheet**: 계층적 확장 (막당 3비트 × 5막 + 막당 개요 1개 × 5막)
- **온디맨드 상세 생성 | On-Demand Detail Generation**: 정책 제어 확장 (개요 블록 → 상세 비트)

### 비용 최적화 | Cost Optimization (Step 7.1)

- **상세 생성 정책 | Detail Generation Policy**: 세션 기반 할당량 및 쿨다운 타이머
  - 세션당 최대 5회 상세 확장
  - 확장 간 2분 쿨다운
- **프롬프트 캐싱 | Prompt Caching**: 캐시 친화적 프롬프트 구조 (안정적 접두사 + 동적 접미사)
- **과도 생성 방지 | Prevent Over-Generation**: 과도한 API 비용 방지를 위한 하드 리밋

### 분석 & 이벤트 추적 | Analytics & Event Tracking (Step 8A)

- **파일 기반 이벤트 저장소 | File-Based Event Store**: `.data/events.jsonl`에 JSON Lines 형식으로 저장
- **익명 신원 추적 | Anonymous Identity Tracking**: 선택적 이메일 연결이 가능한 세션 기반 사용자 ID
- **이벤트 소싱 패턴 | Event Sourcing Pattern**: 모든 사용자 행동의 완전한 감사 추적
- **추적 이벤트 | Tracked Events**:
  - `session_start`, `session_end`
  - `page_view`, `button_click`
  - `form_submit`, `ai_call_start`, `ai_call_end`
  - `error_occurred`

### Supabase 통합 | Supabase Integration (Step 8B) - 선택사항 | Optional

- **인증 | Authentication**: 선택적 이메일 업그레이드가 가능한 익명 인증
- **데이터베이스 스키마 | Database Schema**:
  - `users` - Supabase Auth 통합 사용자 프로필
  - `sessions` - 세션 메타데이터
  - `events` - JSONB 페이로드 저장소를 통한 이벤트 추적
  - `ai_calls` - 프롬프트/응답을 포함한 완전한 AI 상호작용 로그
- **데이터베이스 기반 저장소 | Database-Backed Storage**: PostgreSQL에 이벤트 및 AI 호출 저장
- **행 수준 보안 | Row-Level Security**: RLS 정책을 통한 사용자 데이터 격리

### AI 프롬프트 엔지니어링 | AI Prompt Engineering (Steps 9 & 9.1)

- **실제 프롬프트 저장 | Real Prompt Storage**: `ai_calls` 테이블에 전체 프롬프트 저장 (참조가 아님)
- **프롬프트 빌더 | Prompt Builders**: 각 생성 타입별 모듈형 함수
  - `buildCandidatePrompt()` - 로그라인 생성
  - `buildActsPrompt()` - 5막 구조
  - `buildBlocksPrompt()` - 24블록 비트 시트
  - `buildExpandPrompt()` - 상세 확장
- **SHA-256 해싱 | SHA-256 Hashing**: 콘텐츠 해싱을 통한 프롬프트/응답 중복 제거
- **사용량 메타데이터 | Usage Metadata**: 호출당 토큰 수, 모델 정보, 캐시 통계 저장
- **통합 재생성/확장 | Unified Regenerate/Expand**: 모든 콘텐츠 타입에 대한 단일 재생성 시스템

### 모던 UI 디자인 | Modern UI Design (현재 세션 | Current Session)

- **디자인 시스템 | Design System**:
  - 중앙 정렬 max-w-6xl 컨테이너
  - Gray-50 배경 + 흰색 카드 서페이스
  - Green-600 프라이머리 액센트 컬러
  - 일관된 간격 및 타이포그래피 계층
- **재사용 가능한 컴포넌트 | Reusable Components**:
  - `AppHeader` - 워드마크 + 단계 네비게이션
  - `Stepper` - 쉐브론이 있는 필 기반 진행 표시기
  - `Chip` - 아이콘 지원 태그/배지 컴포넌트
  - `PageShell` - 표준 페이지 컨테이너
- **반응형 디자인 | Responsive Design**: 브레이크포인트 인식 레이아웃의 모바일 우선
- **Z-Index 이슈 수정 | Fixed Z-Index Issues**: Select 드롭다운 레이어 적절히 배치

---

## 기술 스택 | Tech Stack

### 핵심 프레임워크 | Core Framework
- **Next.js 15+** - React 서버 컴포넌트가 있는 App Router
- **TypeScript** - Strict 모드 활성화
- **React 19** - 최신 동시성 기능

### 스타일링 & UI | Styling & UI
- **Tailwind CSS v4** - PostCSS 플러그인(`@tailwindcss/postcss`)이 있는 유틸리티 우선 CSS
- **shadcn/ui patterns** - HSL 기반 테마 토큰이 있는 컴포넌트 아키텍처
- **Lucide React** - 아이콘 라이브러리

### 백엔드 & 데이터베이스 | Backend & Database (선택사항 | Optional)
- **Supabase** - Backend-as-a-Service (선택사항, graceful degradation)
  - PostgreSQL 데이터베이스
  - 익명 인증
  - 행 수준 보안
- **파일 기반 폴백 | File-Based Fallback** - `.data/events.jsonl`의 JSON Lines 이벤트 저장소

### AI & 생성 | AI & Generation
- **Anthropic Claude API** - AI 텍스트 생성
- **프롬프트 캐싱 | Prompt Caching** - 안정적인 접두사를 통한 비용 최적화
- **SHA-256 해싱 | SHA-256 Hashing** - 콘텐츠 중복 제거

### 개발 도구 | Development Tools
- **ESLint** - 코드 린팅
- **PostCSS** - Tailwind v4와 함께 CSS 처리

---

## 프로젝트 구조 | Project Structure

```
story-forge/
├── .data/
│   └── events.jsonl              # 파일 기반 이벤트 저장소 (폴백)
│                                 # File-based event store (fallback)
│
├── public/                       # 정적 자산 | Static assets
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 메타데이터가 있는 루트 레이아웃
│   │   │                         # Root layout with metadata
│   │   ├── globals.css           # Tailwind v4 imports + 테마 토큰
│   │   │                         # Tailwind v4 imports + theme tokens
│   │   └── page.tsx              # 메인 상태 머신 컨트롤러
│   │                             # Main state machine controller
│   │
│   ├── components/
│   │   ├── ui/                   # 기본 UI 프리미티브 | Base UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── select.tsx        # z-index 수정된 커스텀 셀렉트
│   │   │   │                     # Custom select with z-index fix
│   │   │   └── slider.tsx
│   │   │
│   │   ├── AppHeader.tsx         # 워드마크 + 스테퍼가 있는 헤더
│   │   │                         # Header with wordmark + stepper
│   │   ├── Stepper.tsx           # 필 기반 단계 네비게이션
│   │   │                         # Pill-based step navigation
│   │   ├── Chip.tsx              # 태그/배지 컴포넌트 | Tag/badge component
│   │   ├── PageShell.tsx         # 표준 페이지 컨테이너
│   │   │                         # Standard page container
│   │   ├── OptionSelect.tsx      # 재사용 가능한 옵션 선택기
│   │   │                         # Reusable option selector
│   │   ├── InputPanel.tsx        # Step 1: 아이디어 입력 폼 | Idea input form
│   │   ├── OutputPanel.tsx       # Step 2: 후보 비교 | Compare candidates
│   │   ├── ActsPanel.tsx         # Step 3: 5막 개요 | 5-act outline
│   │   ├── BlocksPanel.tsx       # Step 4: 24블록 비트 시트
│   │   │                         # 24-block beat sheet
│   │   └── WritePanel.tsx        # Step 5: 쓰기 허브 | Write hub
│   │
│   ├── data/
│   │   └── options/              # 스토리 설정 데이터
│   │       │                     # Story configuration data
│   │       ├── genres.ts
│   │       ├── themes.ts
│   │       ├── motifs.ts
│   │       ├── realism.ts
│   │       └── tones.ts
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts         # Claude API 클라이언트 | client
│   │   │   ├── prompts.ts        # 프롬프트 빌더 | Prompt builders
│   │   │   └── hash.ts           # SHA-256 해싱 | hashing
│   │   │
│   │   ├── analytics/
│   │   │   ├── identity.ts       # 세션/익명 ID 관리
│   │   │   │                     # Session/anonymous ID management
│   │   │   ├── tracker.ts        # 이벤트 추적 API | Event tracking API
│   │   │   └── store-file.ts     # JSON Lines 파일 저장소
│   │   │                         # JSON Lines file storage
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase 클라이언트 (브라우저)
│   │   │   │                     # Supabase client (browser)
│   │   │   ├── server.ts         # Supabase 클라이언트 (서버)
│   │   │   │                     # Supabase client (server)
│   │   │   └── schema.sql        # 데이터베이스 스키마 + RLS 정책
│   │   │                         # Database schema + RLS policies
│   │   │
│   │   ├── generation/
│   │   │   ├── generateCandidates.ts    # Step 1 → 2
│   │   │   ├── generateActs.ts          # Step 2 → 3
│   │   │   ├── generateBlocks.ts        # Step 3 → 4
│   │   │   └── expandBlock.ts           # 온디맨드 상세 확장
│   │   │                                # On-demand detail expansion
│   │   │
│   │   ├── policy/
│   │   │   └── detailPolicy.ts   # 세션 할당량 + 쿨다운 강제
│   │   │                         # Session quota + cooldown enforcement
│   │   │
│   │   └── utils.ts              # 공유 유틸리티 | Shared utilities
│   │
│   └── types/
│       ├── form.ts               # 입력 폼 상태 | Input form state
│       ├── output.ts             # 후보 결과 | Candidate results
│       ├── acts.ts               # 5막 구조 | 5-act structure
│       ├── blocks.ts             # 24블록 비트 시트 | 24-block beat sheet
│       ├── write.ts              # 쓰기 허브 상태 | Write hub state
│       ├── analytics.ts          # 이벤트 추적 타입 | Event tracking types
│       └── supabase.ts           # 데이터베이스 타입 | Database types
│
├── .env.local.example            # 환경 변수 템플릿
│                                 # Environment variables template
├── tailwind.config.ts            # shadcn 토큰이 있는 Tailwind v4 설정
│                                 # Tailwind v4 config with shadcn tokens
├── postcss.config.mjs            # @tailwindcss/postcss가 있는 PostCSS
├── tsconfig.json                 # TypeScript strict 모드 설정
│                                 # TypeScript strict mode config
├── package.json                  # 의존성 + 스크립트
│                                 # Dependencies + scripts
└── README.md                     # 이 파일 | This file
```

---

## 시작하기 | Getting Started

### 1. 사전 요구사항 | Prerequisites

- Node.js 18+ (권장: 20+ | recommended: 20+)
- npm or yarn
- (선택사항 | Optional) 데이터베이스 기능을 위한 Supabase 계정

### 2. 설치 | Installation

```bash
# 저장소 복제 | Clone the repository
git clone <repository-url>
cd story-forge

# 의존성 설치 | Install dependencies
npm install
```

### 3. 환경 설정 | Environment Setup

예제 환경 파일을 복사하고 설정합니다:

Copy the example environment file and configure:

```bash
cp .env.local.example .env.local
```

`.env.local` 편집 | Edit `.env.local`:

```env
# 필수: Anthropic Claude API | Required
ANTHROPIC_API_KEY=your_claude_api_key_here

# 선택사항: Supabase (이것 없이도 앱 작동) | Optional (app works without these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**참고 | Note**: Supabase 자격 증명이 제공되지 않으면, 앱은:
- 파일 기반 이벤트 저장소 사용 (`.data/events.jsonl`)
- AI 호출에 대한 데이터베이스 지속성 건너뛰기
- 스토리 생성 기능은 여전히 완전히 작동

If Supabase credentials are not provided, the app will use file-based event storage, skip database persistence for AI calls, and still function fully for story generation.

### 4. Supabase 설정 | Supabase Setup (선택사항 | Optional)

분석 및 AI 호출 로깅에 Supabase를 사용하는 경우:

If using Supabase for analytics and AI call logging:

1. 새 Supabase 프로젝트 생성 | Create a new Supabase project
2. 스키마 마이그레이션 실행 | Run the schema migration:
   ```bash
   # src/lib/supabase/schema.sql에서 SQL 복사
   # Copy SQL from src/lib/supabase/schema.sql
   # Supabase SQL 에디터에서 실행 | Run in Supabase SQL Editor
   ```
3. Supabase 대시보드에서 익명 인증 활성화 | Enable Anonymous Auth in Supabase dashboard:
   - Settings → Authentication → Anonymous sign-ins: ON
4. `.env.local`에 환경 변수 추가 | Add environment variables to `.env.local`

### 5. 개발 서버 실행 | Run Development Server

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. 프로덕션 빌드 | Build for Production

```bash
npm run build
npm run start
```

---

## 아키텍처 개요 | Architecture Overview

### 상태 머신 패턴 | State Machine Pattern

애플리케이션은 `src/app/page.tsx`에서 enum 기반 뷰 상태로 중앙 집중식 상태 머신을 사용합니다:

The application uses a centralized state machine in `src/app/page.tsx` with enum-based view states:

```typescript
enum ViewState {
  INPUT = "input",          // Step 1: 스토리 파라미터 설정 | Configure story parameters
  OUTPUT = "output",        // Step 2: 후보 비교 | Compare candidates
  ACTS = "acts",            // Step 3: 5막 개요 | 5-act outline
  BLOCKS = "blocks",        // Step 4: 24블록 비트 시트 | 24-block beat sheet
  WRITE = "write",          // Step 5: 쓰기 허브 | Write hub
}
```

각 상태는 제어된 props 및 콜백과 함께 특정 패널 컴포넌트를 렌더링합니다.

Each state renders a specific panel component with controlled props and callbacks.

### 이벤트 소싱 | Event Sourcing

모든 사용자 상호작용은 불변 이벤트로 추적됩니다:

All user interactions are tracked as immutable events:

```typescript
{
  event_type: "ai_call_end",
  timestamp: "2025-01-15T10:30:45.123Z",
  session_id: "sess_abc123",
  anonymous_id: "anon_xyz789",
  user_id: null,  // 또는 Supabase 사용자 ID | or Supabase user ID
  payload: {
    model: "claude-sonnet-4-5",
    prompt_hash: "sha256:...",
    response_hash: "sha256:...",
    tokens_used: 1234,
    cached_tokens: 5678
  }
}
```

이벤트 저장 위치 | Events are stored in:
- **Supabase**: `events` 테이블 (설정된 경우 | if configured)
- **파일 | File**: `.data/events.jsonl` (폴백 또는 Supabase 사용 불가 시)

### 프롬프트 엔지니어링 전략 | Prompt Engineering Strategy

**캐시 친화적 구조 | Cache-Friendly Structure**:
```
[안정적 접두사 - 캐시됨 | STABLE PREFIX - cached]
- 시스템 지침 | System instructions
- 형식 사양 | Format specifications
- 예제 구조 | Example structures

[동적 접미사 - 캐시 안됨 | DYNAMIC SUFFIX - not cached]
- 사용자 입력 데이터 | User input data
- 컨텍스트별 파라미터 | Context-specific parameters
```

**프롬프트 빌더 | Prompt Builders** (`src/lib/ai/prompts.ts`):
- `buildCandidatePrompt(form)` - 2개의 로그라인 변형 생성 | Generates 2 logline variations
- `buildActsPrompt(logline)` - 5막 구조 생성 | Generates 5-act structure
- `buildBlocksPrompt(acts)` - 24블록 생성 (개요 우선 | overview-first)
- `buildExpandPrompt(block, context)` - 개요를 상세 비트로 확장 | Expands overview to detailed beats

**중복 제거를 위한 해싱 | Hashing for Deduplication**:
```typescript
const hash = await hashContent(prompt + response);
// ai_calls.content_hash에 저장 | Stored in ai_calls.content_hash
// 동일한 생성의 빠른 조회 가능 | Enables fast lookup of identical generations
```

### 상세 생성 정책 | Detail Generation Policy

세션 기반 제한으로 비용 초과 방지:

Prevents cost overruns with session-based limits:

```typescript
const policy = {
  maxDetailExpansionsPerSession: 5,     // 세션당 최대 5회 확장
  detailCooldownMs: 2 * 60 * 1000       // 2분 쿨다운 | 2 minutes
};
```

- **할당량 강제 | Quota Enforcement**: 브라우저 세션당 최대 5회 확장
- **쿨다운 타이머 | Cooldown Timer**: 연속 확장 간 2분 대기
- **UI 피드백 | UI Feedback**: 할당량 소진 또는 쿨다운 시 카운트다운과 함께 버튼 비활성화

### 24블록 시스템 | 24-Block System

점진적 생성에 최적화된 계층적 블록 구조:

Hierarchical block structure optimized for incremental generation:

**1단계: 개요 생성 | Phase 1: Overview Generation** (5 블록 | blocks)
- 막당 1개의 개요 블록 | 1 overview block per act
- 최소 API 비용 | Minimal API cost
- 빠른 초기 구조 | Fast initial structure

**2단계: 온디맨드 상세 | Phase 2: On-Demand Detail** (최대 24블록 | up to 24 blocks)
- 사용자가 개요 블록에서 "확장" 클릭 | User clicks "Expand" on overview block
- 3개의 상세 비트 블록 생성 | Generates 3 detailed beat blocks
- 과도 확장 방지를 위한 정책 제어 | Policy-controlled to prevent over-expansion

**블록 타입 | Block Types**:
```typescript
type BlockType = "overview" | "detail";
type BlockState = "collapsed" | "expanded";
```

---

## 개발 워크플로우 | Development Workflow

### 새 스토리 옵션 추가하기 | Adding a New Story Option

1. `src/data/options/[category].ts`에서 옵션 그룹 정의:

Define option group in `src/data/options/[category].ts`:

```typescript
export const newOptions: OptionGroup = {
  id: "new-category",
  label: "Category Label",
  options: [
    { key: "option1", label: "Option 1" },
    { key: "option2", label: "Option 2" }
  ]
};
```

2. `src/types/form.ts`의 폼 타입에 추가 | Add to form type:

```typescript
export interface FormState {
  newCategory?: string;
  // ...
}
```

3. `InputPanel.tsx`에 OptionSelect 추가 | Add OptionSelect:

```tsx
<OptionSelect
  group={newOptions}
  value={form.newCategory}
  onChange={(val) => updateField("newCategory", val)}
/>
```

### 새 이벤트 타입 추가하기 | Adding a New Event Type

1. `src/types/analytics.ts`에서 `EventType` 업데이트:

Update `EventType` in `src/types/analytics.ts`:

```typescript
export type EventType =
  | "existing_events"
  | "new_event_name";
```

2. 이벤트 추적 | Track the event:

```typescript
import { trackEvent } from "@/lib/analytics/tracker";

await trackEvent("new_event_name", {
  custom_field: "value"
});
```

### AI 프롬프트 수정하기 | Modifying AI Prompts

1. `src/lib/ai/prompts.ts`에서 프롬프트 빌더 편집:

Edit prompt builder in `src/lib/ai/prompts.ts`:

```typescript
export function buildCustomPrompt(data: CustomData): string {
  const stable = `[시스템 지침 - 캐시됨 | SYSTEM INSTRUCTIONS - CACHED]\n...`;
  const dynamic = `[사용자 데이터 - 캐시 안됨 | USER DATA - NOT CACHED]\n${JSON.stringify(data)}`;
  return stable + dynamic;
}
```

2. `src/lib/generation/`에서 해당 생성 함수 업데이트:

Update corresponding generation function in `src/lib/generation/`:

```typescript
export async function generateCustom(data: CustomData) {
  const prompt = buildCustomPrompt(data);
  const result = await callClaude(prompt, { model: "claude-sonnet-4-5" });
  return parseCustomResult(result);
}
```

### Tailwind v4 참고사항 | Tailwind v4 Notes

**중요 | IMPORTANT**: 이 프로젝트는 Tailwind CSS v4 문법을 사용하며, v3가 아닙니다.

This project uses Tailwind CSS v4 syntax, not v3.

**globals.css는 다음을 사용해야 합니다 | globals.css must use**:
```css
@import "tailwindcss";  /* @tailwind 지시어 아님 | NOT @tailwind directives */

:root {
  --background: 0 0% 100%;  /* 직접 CSS 변수, @layer 없음 | Direct CSS variables, NO @layer */
}
```

**CSS 적용이 중지되는 경우 | If CSS stops applying**:
1. `globals.css`가 `@import "tailwindcss"`를 사용하는지 확인
2. `@layer base` 래퍼가 없는지 확인
3. 캐시 지우기 | Clear cache: `rm -rf .next`
4. `postcss.config.mjs`가 `@tailwindcss/postcss`를 사용하는지 확인

---

## 컴포넌트 API | Component API

### AppHeader

```tsx
<AppHeader currentStep={{ id: "idea", label: "Idea" }} />
```

Props:
- `currentStep?: { id: string; label: string }` - 스테퍼에서 현재 단계 강조 표시 | Highlights current step in stepper

### Stepper

```tsx
<Stepper
  steps={[
    { id: "step1", label: "Step 1" },
    { id: "step2", label: "Step 2" }
  ]}
  currentStep={{ id: "step1", label: "Step 1" }}
/>
```

### Chip

```tsx
<Chip icon={Check} variant="success">Label</Chip>
```

Variants: `"default" | "success" | "info" | "warning"`

### PageShell

```tsx
<PageShell
  title="페이지 제목 | Page Title"
  subtitle="선택적 설명 | Optional description"
  action={<Button>액션 | Action</Button>}
  maxWidth="6xl"
>
  {children}
</PageShell>
```

---

## 디자인 시스템 | Design System

### 색상 | Colors
- **Primary**: Green-600 (`hsl(142.1 76.2% 36.3%)`)
- **Background**: Gray-50
- **Card Surface**: White
- **Text**: Gray-900 (제목 | headings), Gray-600 (본문 | body), Gray-500 (음소거 | muted)
- **Border**: Gray-200

### 타이포그래피 | Typography
- **페이지 제목 | Page Title**: `text-4xl font-semibold tracking-tight`
- **섹션 제목 | Section Heading**: `text-2xl font-semibold`
- **본문 | Body**: `text-base text-gray-600`
- **작게 | Small**: `text-sm text-gray-500`

### 간격 | Spacing
- **컨테이너 | Container**: `max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8`
- **카드 패딩 | Card Padding**: `p-6`
- **그리드 갭 | Grid Gaps**: `gap-6` (크게 | large), `gap-4` (중간 | medium)

### 반응형 브레이크포인트 | Responsive Breakpoints
- **모바일 | Mobile**: 기본 | Default (< 640px)
- **태블릿 | Tablet**: `sm:` (≥ 640px)
- **데스크탑 | Desktop**: `lg:` (≥ 1024px)

---

## 기능 구현 타임라인 | Feature Implementation Timeline

### Step 7.1 - 비용 최적화 | Cost Optimization
- ✅ 세션 할당량이 있는 상세 생성 정책
- ✅ 확장 간 쿨다운 타이머
- ✅ 상세 생성에 대한 하드 리밋

### Step 8A - 분석 | Analytics (파일 기반 | File-Based)
- ✅ 익명 신원 추적
- ✅ JSON Lines 이벤트 저장소
- ✅ 완전한 이벤트 소싱 패턴

### Step 8B - Supabase 통합 | Supabase Integration
- ✅ 익명 인증
- ✅ RLS 정책이 있는 데이터베이스 스키마
- ✅ 이벤트 및 AI 호출 지속성
- ✅ 사용 불가 시 Graceful degradation

### Step 9 - 프롬프트 저장 | Prompt Storage
- ✅ `ai_calls`에 저장된 전체 프롬프트 텍스트
- ✅ 모듈형 프롬프트 빌더 함수
- ✅ 캐시 친화적 구조 (안정적 접두사)

### Step 9.1 - 프롬프트 최적화 | Prompt Optimization
- ✅ 중복 제거를 위한 SHA-256 해싱
- ✅ 사용량 메타데이터 (토큰, 모델, 캐시 통계)
- ✅ 통합 재생성/확장 프롬프트 시스템

### 현재 세션 | Current Session - UI 리디자인 | UI Redesign
- ✅ AppHeader + Stepper 컴포넌트
- ✅ Chip + PageShell 컴포넌트
- ✅ 아이디어 입력 페이지 리디자인 (2열 레이아웃 | two-column)
- ✅ 비교 페이지 리디자인 (나란히 카드 | side-by-side cards)
- ✅ 5막 개요 페이지 리디자인 (5열 그리드 | 5-column grid)
- ✅ Select z-index 이슈 수정
- ✅ Tailwind v4 CSS 문법 수정
- ⏳ 24블록 비트 시트 리디자인 (진행 중 | in progress)
- ⏳ 쓰기 허브 리디자인 (대기 중 | pending)
- ⏳ 모바일 반응형 테스트 (대기 중 | pending)

---

## 알려진 이슈 & 제한사항 | Known Issues & Limitations

### 현재 제한사항 | Current Limitations
1. **사용자 인증 없음 | No User Authentication**: 익명 세션만 (의도된 설계 | by design)
2. **지속적인 사용자 계정 없음 | No Persistent User Accounts**: 브라우저 세션에 연결된 데이터
3. **클라우드 저장소 없음 | No Cloud Storage**: 모든 데이터는 로컬 또는 Supabase에 저장 (설정된 경우)
4. **단일 사용자 | Single User**: 협업 기능 없음

### 남은 작업 | Pending Work
1. 24블록 비트 시트 페이지 리디자인 완료
2. 쓰기 허브 페이지 리디자인 완료
3. 모든 페이지에서 모바일 반응형 테스트
4. Graceful 에러 처리를 위한 에러 경계 추가
5. AI 생성 호출에 대한 로딩 상태 추가

---

## 기여 | Contributing

이것은 개인 프로젝트입니다. 제안이나 버그 리포트는 이슈를 열어주세요.

This is a personal project. For suggestions or bug reports, please open an issue.

---

## 라이선스 | License

[여기에 라이선스 추가 | Add your license here]

---

## 감사의 말 | Acknowledgments

- [Next.js](https://nextjs.org/)로 구축 | Built with Next.js
- [shadcn/ui](https://ui.shadcn.com/)에서 영감을 받은 UI 컴포넌트 | UI components inspired by shadcn/ui
- [Lucide](https://lucide.dev/)의 아이콘 | Icons from Lucide
- [Anthropic Claude](https://www.anthropic.com/)로 구동되는 AI | AI powered by Anthropic Claude
