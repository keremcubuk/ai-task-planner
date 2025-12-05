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
- **Export**: 
  - **Raw**: Export data in original import format for backup.
  - **Stats**: Export summary statistics and detailed reports.
- **AI Prioritization**: Intelligent scoring engine that re-ranks tasks based on severity, deadlines, and manual priority.
- **Analytics**: Visual dashboard showing task completion rates, severity distribution, and team performance.

### 🎨 User Experience
- **Modern UI**: Clean interface built with Tailwind CSS and Lucide Icons.
- **Modal-based Workflows**: Create and view task details without losing context of your dashboard.
- **Responsive Design**: Optimized for desktop usage.

## Prerequisites
- Node.js (v18+)
- npm

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

- **Backend**: NestJS, Prisma ORM, SQLite.
- **Frontend**: Next.js (Pages Router), Tailwind CSS, Axios, dnd-kit, Recharts.
- **Storage**: Local SQLite database (`backend/db/planner.sqlite`).

## Development

- **History**: Check `HISTORY.md` for a log of changes and implemented features.
