# AI Task Planner - Backend

NestJS backend for the AI Task Planner application with SQLite database and optional Ollama AI integration.

## Tech Stack

- **Framework**: NestJS
- **Database**: SQLite with Prisma ORM
- **AI Integration**: Ollama client service for local LLM processing
- **File Processing**: CSV/XLSX import/export support

## Project Structure

```
src/
├── modules/
│   ├── tasks/           # Task CRUD operations
│   ├── import/          # CSV/XLSX import with duplicate detection
│   ├── export/          # Data export functionality
│   ├── ai/              # AI services
│   │   ├── ollama-client.service.ts      # Ollama HTTP client
│   │   ├── component-issue-summary.service.ts  # AI summary generation
│   │   └── ai.service.ts                 # Priority scoring
│   └── analytics/       # Analytics aggregation
├── shared/
│   └── prisma/          # Prisma service and schema
└── main.ts

prisma/
├── schema.prisma        # Database schema
└── migrations/

db/
└── planner.sqlite       # SQLite database file
```

## Setup

```bash
npm install
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run database migrations
```

## Development

```bash
npm run start:dev      # Watch mode on port 3000
```

## Production

```bash
npm run build
npm run start:prod
```

## Testing

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Key Features

### Task Management
- Full CRUD operations with soft delete
- Manual priority (0-5) and AI-calculated priority scores
- Drag-and-drop position management
- Duplicate detection via content hashing

### Import/Export
- CSV and XLSX import with column mapping
- Duplicate detection during import
- Export in raw format (backup) or stats format (reports)

### AI Services
- **Ollama Client**: HTTP client with AbortController timeout handling
- **Component Issue Summary**: Turkish language AI summaries using local LLM
- **AI Prioritization**: Rule-based scoring with normalized task age

### Analytics
- Project-level aggregations
- Developer performance metrics
- Component-based issue tracking
- Bucket category analysis (solvedInComponent, solvedInProject, etc.)

## Environment Variables

```env
DATABASE_URL="file:./db/planner.sqlite"
```

## Ollama Configuration

AI features require Ollama running locally:

1. Install Ollama: https://ollama.com
2. Pull model: `ollama pull llama3.2`
3. Start Ollama service on default port 11434

The `OllamaClientService` supports:
- Configurable timeout (default 30s, 120s for summaries)
- JSON mode for structured output
- Automatic fallback to pattern matching when Ollama unavailable

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
