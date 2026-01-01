# story-forge

Block-based story and web novel ideation tool with AI-powered narrative generation, structured outlining, and cost-optimized expansion.

## Overview

**story-forge** is a Next.js-based tool designed to help writers brainstorm and structure stories using a systematic, block-based approach. It guides users through a multi-step workflow:

1. **Idea Input** - Configure story parameters (tone, realism, genre, themes, motifs)
2. **Compare Candidates** - Review and select from 2 AI-generated logline variations
3. **5-Act Outline** - Generate a classic 5-act story structure
4. **24-Block Beat Sheet** - Expand into detailed scene-level beats with on-demand detail generation
5. **Write Hub** - Manage narrative content with variant support

The tool emphasizes **cost efficiency** through intelligent prompt caching, policy-based detail generation, and event-driven analytics.

---

## Key Features

### Core Story Generation Workflow
- **Idea Generator**: Multi-parameter story configuration with tone presets, realism slider, genre/theme/motif selection
- **Candidate Comparison**: Side-by-side evaluation of 2 AI-generated logline variations
- **5-Act Structure**: Automatic generation of Setup → Progress → Crisis → Climax → Resolution
- **24-Block Beat Sheet**: Hierarchical expansion with 3 beats per act × 5 acts + 1 overview × 5 acts
- **On-Demand Detail Generation**: Policy-controlled expansion from overview blocks to detailed beats

### Cost Optimization (Step 7.1)
- **Detail Generation Policy**: Session-based quotas and cooldown timers
  - Max 5 detail expansions per session
  - 2-minute cooldown between expansions
- **Prompt Caching**: Cache-friendly prompt structure (stable prefix + dynamic suffix)
- **Prevent Over-Generation**: Hard limits prevent excessive API costs

### Analytics & Event Tracking (Step 8A)
- **File-Based Event Store**: JSON Lines (.jsonl) format at `.data/events.jsonl`
- **Anonymous Identity Tracking**: Session-based user IDs with optional email linkage
- **Event Sourcing Pattern**: Complete audit trail of all user actions
- **Tracked Events**:
  - `session_start`, `session_end`
  - `page_view`, `button_click`
  - `form_submit`, `ai_call_start`, `ai_call_end`
  - `error_occurred`

### Supabase Integration (Step 8B) - Optional
- **Authentication**: Anonymous auth with optional email upgrade
- **Database Schema**:
  - `users` - User profiles with Supabase Auth integration
  - `sessions` - Session metadata
  - `events` - Event tracking with JSONB payload storage
  - `ai_calls` - Complete AI interaction logs with prompts/responses
- **Database-Backed Storage**: Events and AI calls persisted to PostgreSQL
- **Row-Level Security**: User data isolation with RLS policies

### AI Prompt Engineering (Steps 9 & 9.1)
- **Real Prompt Storage**: Full prompts stored in `ai_calls` table (not just references)
- **Prompt Builders**: Modular functions for each generation type:
  - `buildCandidatePrompt()` - Logline generation
  - `buildActsPrompt()` - 5-act structure
  - `buildBlocksPrompt()` - 24-block beat sheet
  - `buildExpandPrompt()` - Detail expansion
- **SHA-256 Hashing**: Prompt/response deduplication via content hashing
- **Usage Metadata**: Token counts, model info, cache stats stored per call
- **Unified Regenerate/Expand**: Single regeneration system for all content types

### Modern UI Design (Current Session)
- **Design System**:
  - Centered max-w-6xl containers
  - Gray-50 backgrounds with white card surfaces
  - Green-600 primary accent color
  - Consistent spacing and typography hierarchy
- **Reusable Components**:
  - `AppHeader` - Wordmark + step navigation
  - `Stepper` - Pill-based progress indicator with chevrons
  - `Chip` - Tag/badge component with icon support
  - `PageShell` - Standard page container
- **Responsive Design**: Mobile-first with breakpoint-aware layouts
- **Fixed Z-Index Issues**: Select dropdowns properly layered

---

## Tech Stack

### Core Framework
- **Next.js 15+** - App Router with React Server Components
- **TypeScript** - Strict mode enabled
- **React 19** - Latest concurrent features

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS with PostCSS plugin (`@tailwindcss/postcss`)
- **shadcn/ui patterns** - Component architecture with HSL-based theme tokens
- **Lucide React** - Icon library

### Backend & Database (Optional)
- **Supabase** - Backend-as-a-Service (optional, graceful degradation)
  - PostgreSQL database
  - Anonymous authentication
  - Row-level security
- **File-Based Fallback** - JSON Lines event store at `.data/events.jsonl`

### AI & Generation
- **Anthropic Claude API** - AI text generation
- **Prompt Caching** - Cost optimization through stable prefixes
- **SHA-256 Hashing** - Content deduplication

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing with Tailwind v4

---

## Project Structure

```
story-forge/
├── .data/
│   └── events.jsonl              # File-based event store (fallback)
│
├── public/                       # Static assets
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── globals.css           # Tailwind v4 imports + theme tokens
│   │   └── page.tsx              # Main state machine controller
│   │
│   ├── components/
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── select.tsx        # Custom select with z-index fix
│   │   │   └── slider.tsx
│   │   │
│   │   ├── AppHeader.tsx         # Header with wordmark + stepper
│   │   ├── Stepper.tsx           # Pill-based step navigation
│   │   ├── Chip.tsx              # Tag/badge component
│   │   ├── PageShell.tsx         # Standard page container
│   │   ├── OptionSelect.tsx      # Reusable option selector
│   │   ├── InputPanel.tsx        # Step 1: Idea input form
│   │   ├── OutputPanel.tsx       # Step 2: Compare candidates
│   │   ├── ActsPanel.tsx         # Step 3: 5-act outline
│   │   ├── BlocksPanel.tsx       # Step 4: 24-block beat sheet
│   │   └── WritePanel.tsx        # Step 5: Write hub
│   │
│   ├── data/
│   │   └── options/              # Story configuration data
│   │       ├── genres.ts
│   │       ├── themes.ts
│   │       ├── motifs.ts
│   │       ├── realism.ts
│   │       └── tones.ts
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts         # Claude API client
│   │   │   ├── prompts.ts        # Prompt builders
│   │   │   └── hash.ts           # SHA-256 hashing
│   │   │
│   │   ├── analytics/
│   │   │   ├── identity.ts       # Session/anonymous ID management
│   │   │   ├── tracker.ts        # Event tracking API
│   │   │   └── store-file.ts     # JSON Lines file storage
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client (browser)
│   │   │   ├── server.ts         # Supabase client (server)
│   │   │   └── schema.sql        # Database schema + RLS policies
│   │   │
│   │   ├── generation/
│   │   │   ├── generateCandidates.ts    # Step 1 → 2
│   │   │   ├── generateActs.ts          # Step 2 → 3
│   │   │   ├── generateBlocks.ts        # Step 3 → 4
│   │   │   └── expandBlock.ts           # On-demand detail expansion
│   │   │
│   │   ├── policy/
│   │   │   └── detailPolicy.ts   # Session quota + cooldown enforcement
│   │   │
│   │   └── utils.ts              # Shared utilities
│   │
│   └── types/
│       ├── form.ts               # Input form state
│       ├── output.ts             # Candidate results
│       ├── acts.ts               # 5-act structure
│       ├── blocks.ts             # 24-block beat sheet
│       ├── write.ts              # Write hub state
│       ├── analytics.ts          # Event tracking types
│       └── supabase.ts           # Database types
│
├── .env.local.example            # Environment variables template
├── tailwind.config.ts            # Tailwind v4 config with shadcn tokens
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss
├── tsconfig.json                 # TypeScript strict mode config
├── package.json                  # Dependencies + scripts
└── README.md                     # This file
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- (Optional) Supabase account for database features

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd story-forge

# Install dependencies
npm install
```

### 3. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required: Anthropic Claude API
ANTHROPIC_API_KEY=your_claude_api_key_here

# Optional: Supabase (app works without these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: If Supabase credentials are not provided, the app will:
- Use file-based event storage (`.data/events.jsonl`)
- Skip database persistence for AI calls
- Still function fully for story generation

### 4. Supabase Setup (Optional)

If using Supabase for analytics and AI call logging:

1. Create a new Supabase project
2. Run the schema migration:
   ```bash
   # Copy SQL from src/lib/supabase/schema.sql
   # Run in Supabase SQL Editor
   ```
3. Enable Anonymous Auth in Supabase dashboard:
   - Settings → Authentication → Anonymous sign-ins: ON
4. Add environment variables to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm run start
```

---

## Architecture Overview

### State Machine Pattern

The application uses a centralized state machine in `src/app/page.tsx` with enum-based view states:

```typescript
enum ViewState {
  INPUT = "input",          // Step 1: Configure story parameters
  OUTPUT = "output",        // Step 2: Compare candidates
  ACTS = "acts",            // Step 3: 5-act outline
  BLOCKS = "blocks",        // Step 4: 24-block beat sheet
  WRITE = "write",          // Step 5: Write hub
}
```

Each state renders a specific panel component with controlled props and callbacks.

### Event Sourcing

All user interactions are tracked as immutable events:

```typescript
{
  event_type: "ai_call_end",
  timestamp: "2025-01-15T10:30:45.123Z",
  session_id: "sess_abc123",
  anonymous_id: "anon_xyz789",
  user_id: null,  // or Supabase user ID
  payload: {
    model: "claude-sonnet-4-5",
    prompt_hash: "sha256:...",
    response_hash: "sha256:...",
    tokens_used: 1234,
    cached_tokens: 5678
  }
}
```

Events are stored in:
- **Supabase**: `events` table (if configured)
- **File**: `.data/events.jsonl` (fallback or when Supabase unavailable)

### Prompt Engineering Strategy

**Cache-Friendly Structure**:
```
[STABLE PREFIX - cached]
- System instructions
- Format specifications
- Example structures

[DYNAMIC SUFFIX - not cached]
- User input data
- Context-specific parameters
```

**Prompt Builders** (`src/lib/ai/prompts.ts`):
- `buildCandidatePrompt(form)` - Generates 2 logline variations
- `buildActsPrompt(logline)` - Generates 5-act structure
- `buildBlocksPrompt(acts)` - Generates 24 blocks (overview-first)
- `buildExpandPrompt(block, context)` - Expands overview to detailed beats

**Hashing for Deduplication**:
```typescript
const hash = await hashContent(prompt + response);
// Stored in ai_calls.content_hash
// Enables fast lookup of identical generations
```

### Detail Generation Policy

Prevents cost overruns with session-based limits:

```typescript
const policy = {
  maxDetailExpansionsPerSession: 5,
  detailCooldownMs: 2 * 60 * 1000  // 2 minutes
};
```

- **Quota Enforcement**: Max 5 expansions per browser session
- **Cooldown Timer**: 2-minute wait between consecutive expansions
- **UI Feedback**: Buttons disabled with countdown when quota exhausted or on cooldown

### 24-Block System

Hierarchical block structure optimized for incremental generation:

**Phase 1: Overview Generation** (5 blocks)
- 1 overview block per act
- Minimal API cost
- Fast initial structure

**Phase 2: On-Demand Detail** (up to 24 blocks)
- User clicks "Expand" on overview block
- Generates 3 detailed beat blocks
- Policy-controlled to prevent over-expansion

**Block Types**:
```typescript
type BlockType = "overview" | "detail";
type BlockState = "collapsed" | "expanded";
```

---

## Development Workflow

### Adding a New Story Option

1. Define option group in `src/data/options/[category].ts`:
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

2. Add to form type in `src/types/form.ts`:
```typescript
export interface FormState {
  newCategory?: string;
  // ...
}
```

3. Add OptionSelect in `InputPanel.tsx`:
```tsx
<OptionSelect
  group={newOptions}
  value={form.newCategory}
  onChange={(val) => updateField("newCategory", val)}
/>
```

### Adding a New Event Type

1. Update `EventType` in `src/types/analytics.ts`:
```typescript
export type EventType =
  | "existing_events"
  | "new_event_name";
```

2. Track the event:
```typescript
import { trackEvent } from "@/lib/analytics/tracker";

await trackEvent("new_event_name", {
  custom_field: "value"
});
```

### Modifying AI Prompts

1. Edit prompt builder in `src/lib/ai/prompts.ts`:
```typescript
export function buildCustomPrompt(data: CustomData): string {
  const stable = `[SYSTEM INSTRUCTIONS - CACHED]\n...`;
  const dynamic = `[USER DATA - NOT CACHED]\n${JSON.stringify(data)}`;
  return stable + dynamic;
}
```

2. Update corresponding generation function in `src/lib/generation/`:
```typescript
export async function generateCustom(data: CustomData) {
  const prompt = buildCustomPrompt(data);
  const result = await callClaude(prompt, { model: "claude-sonnet-4-5" });
  return parseCustomResult(result);
}
```

### Tailwind v4 Notes

**IMPORTANT**: This project uses Tailwind CSS v4 syntax, not v3.

**globals.css must use**:
```css
@import "tailwindcss";  /* NOT @tailwind directives */

:root {
  --background: 0 0% 100%;  /* Direct CSS variables, NO @layer */
}
```

**If CSS stops applying**:
1. Check `globals.css` uses `@import "tailwindcss"`
2. Check no `@layer base` wrappers
3. Clear cache: `rm -rf .next`
4. Verify `postcss.config.mjs` uses `@tailwindcss/postcss`

---

## Component API

### AppHeader
```tsx
<AppHeader currentStep={{ id: "idea", label: "Idea" }} />
```
Props:
- `currentStep?: { id: string; label: string }` - Highlights current step in stepper

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
  title="Page Title"
  subtitle="Optional description"
  action={<Button>Action</Button>}
  maxWidth="6xl"
>
  {children}
</PageShell>
```

---

## Design System

### Colors
- **Primary**: Green-600 (`hsl(142.1 76.2% 36.3%)`)
- **Background**: Gray-50
- **Card Surface**: White
- **Text**: Gray-900 (headings), Gray-600 (body), Gray-500 (muted)
- **Border**: Gray-200

### Typography
- **Page Title**: `text-4xl font-semibold tracking-tight`
- **Section Heading**: `text-2xl font-semibold`
- **Body**: `text-base text-gray-600`
- **Small**: `text-sm text-gray-500`

### Spacing
- **Container**: `max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8`
- **Card Padding**: `p-6`
- **Grid Gaps**: `gap-6` (large), `gap-4` (medium)

### Responsive Breakpoints
- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)

---

## Feature Implementation Timeline

### Step 7.1 - Cost Optimization
- ✅ Detail generation policy with session quotas
- ✅ Cooldown timers between expansions
- ✅ Hard limits on detail generation

### Step 8A - Analytics (File-Based)
- ✅ Anonymous identity tracking
- ✅ JSON Lines event store
- ✅ Complete event sourcing pattern

### Step 8B - Supabase Integration
- ✅ Anonymous authentication
- ✅ Database schema with RLS policies
- ✅ Event and AI call persistence
- ✅ Graceful degradation when unavailable

### Step 9 - Prompt Storage
- ✅ Full prompt text stored in `ai_calls`
- ✅ Modular prompt builder functions
- ✅ Cache-friendly structure (stable prefix)

### Step 9.1 - Prompt Optimization
- ✅ SHA-256 hashing for deduplication
- ✅ Usage metadata (tokens, model, cache stats)
- ✅ Unified regenerate/expand prompt system

### Current Session - UI Redesign
- ✅ AppHeader + Stepper components
- ✅ Chip + PageShell components
- ✅ Redesigned Idea Input page (two-column)
- ✅ Redesigned Compare page (side-by-side cards)
- ✅ Redesigned 5-Act Outline page (5-column grid)
- ✅ Fixed Select z-index issues
- ✅ Fixed Tailwind v4 CSS syntax
- ⏳ 24-Block Beat Sheet redesign (in progress)
- ⏳ Write Hub redesign (pending)
- ⏳ Mobile responsiveness testing (pending)

---

## Known Issues & Limitations

### Current Limitations
1. **No User Authentication**: Only anonymous sessions (by design)
2. **No Persistent User Accounts**: Data tied to browser session
3. **No Cloud Storage**: All data stored locally or in Supabase (if configured)
4. **Single User**: No collaboration features

### Pending Work
1. Complete 24-Block Beat Sheet page redesign
2. Complete Write Hub page redesign
3. Mobile responsiveness testing across all pages
4. Add error boundaries for graceful error handling
5. Add loading states for AI generation calls

---

## Contributing

This is a personal project. For suggestions or bug reports, please open an issue.

---

## License

[Add your license here]

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
