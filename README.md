# Local Unified AI Task Planner

A local-first, AI-assisted task planner application built with **NestJS** and **Next.js**.

## Features

### 🚀 Core Functionality
- **Local Data Privacy**: All data stored locally in SQLite. No cloud dependency.
- **Task Management**: Create, read, update, and delete tasks.
- **Drag & Drop**: Reorder tasks manually with ease.
- **Projects**: Organize tasks by projects and view project-specific dashboards.

### 📊 Data Intelligence
- **Import**: Support for bulk importing tasks via CSV and XLSX.
- **Export**: Single dropdown with "Raw" (backup) and "Stats" (reports) options.
- **AI Prioritization**: Intelligent scoring engine with normalized task age (capped at 30 days).
- **Analytics**: Visual dashboard with projects, developers, issue openers, components, and trends.
- **Component Analysis**: AI-powered UI component detection and issue tracking from task descriptions.
- **AI Issue Summary**: Turkish language summaries of component issues using local LLM (Ollama).

### 🎨 User Experience
- **Modern UI**: Clean interface built with Tailwind CSS and Lucide Icons.
- **Modal-based Workflows**: Create and view task details without losing context of your dashboard.
- **Responsive Design**: Optimized for desktop usage.

## Prerequisites
- Node.js (v18+)
- npm
- **Optional**: [Ollama](https://ollama.com) for AI features (component analysis, AI summaries)

## Installation & Running

1. Navigate to the project root:
   ```bash
   cd planner-app
   ```

2. Run the start script:
   ```bash
   ./start.sh
   ```

This script will automatically:
- Install dependencies for both Backend and Frontend.
- Initialize the SQLite database using Prisma.
- Start the Backend server on port `3000`.
- Start the Frontend application on port `3001`.

## Usage

- **Dashboard**: Access at `http://localhost:3001`.
- **Manage Tasks**: Use the "New Task" button to create tasks via popup.
- **Import**: Use the "Import" button to upload existing task lists.
- **Prioritize**: Click "AI Prioritize" to let the system organize your workload.
- **Analytics**: Check the Analytics tab for insights.

## Architecture

- **Backend**: NestJS, Prisma ORM, SQLite, Ollama client service.
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, React Query, Zustand, Zod.
- **Storage**: Local SQLite database (`backend/db/planner.sqlite`).
- **AI**: Optional Ollama integration for local LLM processing.

## Ollama Configuration (Optional)

To enable AI features:

1. Install Ollama: https://ollama.com
2. Pull a model (e.g., `ollama pull llama3.2`)
3. Ensure Ollama is running on `localhost:11434`
4. In Analytics → Components tab, click "Use AI" before analyzing

## Development

- **History**: Check `HISTORY.md` for a log of changes and implemented features.
