# AI Task Planner - Frontend

Next.js 16 frontend for the AI Task Planner application.

## Tech Stack

- **Framework**: Next.js 16.0.7 with App Router
- **React**: 19.2.0 with TypeScript strict mode
- **Styling**: Tailwind CSS v4
- **State Management**:
  - React Query (@tanstack/react-query v5) for server state
  - Zustand for client state
- **Validation**: Zod
- **Notifications**: Sonner toast
- **Icons**: Lucide React
- **Charts**: Recharts

## Project Structure

```
app/                    # Next.js App Router
├── page.tsx           # Dashboard (Server Component)
├── analytics/         # Analytics page
├── calendar/          # Calendar view
├── projects/[name]/   # Project detail pages
├── import/            # Task import page
├── api/hello/         # API routes
├── layout.tsx         # Root layout with providers
├── loading.tsx        # Global loading state
├── error.tsx          # Global error boundary
└── not-found.tsx      # 404 page

components/
├── DashboardClient.tsx       # Dashboard interactive logic
├── AnalyticsClient.tsx       # Analytics interactive logic
├── ComponentAnalysisSection.tsx  # Component analysis UI
├── ComponentIssueSummaryModal.tsx # AI summary modal
└── ui/                       # Reusable UI components

hooks/
├── useTasks.ts
├── useProjects.ts
├── useAnalytics.ts
└── useReviewScores.ts

lib/
├── api.ts             # API client functions
└── utils.ts           # Utility functions
```

## Architecture Patterns

- **Server Components**: Page routes are Server Components by default for better performance
- **Client Components**: Interactive components use `'use client'` directive
- **Path Aliases**: `@/*` (root), `@lib/*`, `@components/*`

## Development

```bash
npm run dev      # Start development server on port 3001
npm run build    # Production build
npm run lint     # Run ESLint
```

## Testing

```bash
npm run test:run # Vitest unit tests
npm run test:e2e # Playwright E2E tests
```

## Key Features

- **Dashboard**: Task management with drag-and-drop reordering
- **Analytics**: Multi-tab analytics (Projects, Developers, Openers, Components, Trends, Tasks)
- **Component Analysis**: AI-powered UI component detection (optional Ollama)
- **AI Issue Summary**: Turkish language summaries of component issues
- **Task Import**: CSV/XLSX bulk import with duplicate detection
