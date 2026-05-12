# Project History

## Initial Setup
- Set up Monorepo structure (planner-app).
- Initialized Backend (NestJS) and Frontend (Next.js).
- Configured Prisma with SQLite.

## Backend Development
- Implemented Tasks Module (CRUD).
- Implemented Import Module (CSV/XLSX parsing).
- Implemented Export Module (XLSX).
- Implemented AI Prioritization Module (Rule-based scoring).
- Added database reset functionality with password protection.

## Frontend Development
- Built Dashboard with Task Table.
- Implemented Drag & Drop reordering using `@dnd-kit`.
- Created Task Details, Import, and Create pages.
- Added Analytics page with charts.
- Added Projects view for grouped task management.

## Enhancements & UX
- Added "Back" navigation button to Task Details.
- Implemented Modals for "Create Task" and "Task Details" for better context preservation.
- Standardized Date format to `DD-MM-YYYY`.
- Added Severity and Priority badges.
- **Consolidated Export UI**: Replaced separate "Raw" and "Stats" buttons with single "Export" dropdown.
- **Manual Priority Dropdown**: Changed from free input to select dropdown (0-5) for better UX.
- Improved Modal UI with lighter backdrop and blur effect.
- Added common Layout and Header structure.

## Frontend Modernization (2026)
- **Migrated to Next.js 16** with App Router architecture.
- **React 19.2.0** with TypeScript strict mode.
- **Tailwind CSS v4** for styling.
- **State Management**: React Query (@tanstack/react-query v5) for server state, Zustand for client state.
- **Notifications**: Sonner toast notifications.
- **Validation**: Zod schema validation.
- **Performance**: Server Components for pages, Client Components for interactive logic.

## AI & Component Analysis
- **UI Component Detection**: Pattern-based and LLM-powered component extraction from task descriptions.
- **Component Analytics**: Visual analysis of component-related issues with severity tracking.
- **AI Issue Summary**: "AI Özet" feature for generating Turkish summaries of component issues.
- **Ollama Integration**: Local LLM support with configurable models.

## Bug Fixes & Improvements (May 2026)
- **Fixed Ollama Timeout**: Implemented proper AbortController-based timeout handling (was causing "socket hang up" errors).
- **Fixed JSON Parse Errors**: Added Ollama JSON mode support and improved LLM output parsing with better fallbacks.
- **AI Toggle Default**: "Use AI" checkbox now defaults to unchecked for manual control.
- **AI Prioritization**: Normalized task age scoring (capped at 30 days) to prevent old tasks from outranking critical ones.

## Date
- Last Updated: May 12, 2026
