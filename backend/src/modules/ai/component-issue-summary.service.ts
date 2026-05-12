import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OllamaClientService, OllamaConfig } from './ollama-client.service';

export type SummaryScope = 'open' | 'all';

export interface CompIssueSummaryDto {
  componentName: string;
  scope: SummaryScope;
  summary: string;
  focusAreas: string[];
  taskCount: number;
  inputHash: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  isStale?: boolean;
  currentTaskCount?: number;
}

const MAX_TASKS_IN_PROMPT = 80;
const MAX_DESC_CHARS = 800;
const SUMMARY_NUM_PREDICT = 800;
const SUMMARY_TIMEOUT_MS = 120000;

@Injectable()
export class CompIssueSummaryService {
  private readonly logger = new Logger(CompIssueSummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaClientService,
  ) {}

  private async fetchTasks(componentName: string, scope: SummaryScope) {
    const target = componentName.trim();
    if (!target) return [];

    const lower = target.toLowerCase();
    const where: Record<string, unknown> = {
      OR: [
        { componentName: { equals: target } },
        { componentName: { equals: lower } },
        { title: { contains: target } },
        { description: { contains: target } },
      ],
    };
    if (scope === 'open') {
      where.NOT = [{ status: 'done' }, { status: 'completed' }];
    }

    return this.prisma.task.findMany({
      where: where as never,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        severity: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private computeHash(
    tasks: { id: number; title: string; description: string | null }[],
  ): string {
    const data = tasks
      .map((t) => [t.id, t.title || '', t.description || ''])
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    const json = JSON.stringify(data);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  async getSummary(
    componentName: string,
    scope: SummaryScope,
  ): Promise<CompIssueSummaryDto | null> {
    const cached = await this.prisma.compIssueSummary.findUnique({
      where: { componentName_scope: { componentName, scope } },
    });
    if (!cached) return null;

    const tasks = await this.fetchTasks(componentName, scope);
    const currentHash = this.computeHash(tasks);
    const isStale = currentHash !== cached.inputHash;

    let focusAreas: string[] = [];
    try {
      const parsed = JSON.parse(cached.focusAreas);
      if (Array.isArray(parsed)) focusAreas = parsed.filter((x) => typeof x === 'string');
    } catch {
      focusAreas = [];
    }

    return {
      componentName: cached.componentName,
      scope: cached.scope as SummaryScope,
      summary: cached.summary,
      focusAreas,
      taskCount: cached.taskCount,
      inputHash: cached.inputHash,
      model: cached.model,
      createdAt: cached.createdAt.toISOString(),
      updatedAt: cached.updatedAt.toISOString(),
      isStale,
      currentTaskCount: tasks.length,
    };
  }

  async generateSummary(
    componentName: string,
    scope: SummaryScope,
    force: boolean = false,
    config?: Partial<OllamaConfig>,
  ): Promise<CompIssueSummaryDto> {
    const tasks = await this.fetchTasks(componentName, scope);

    if (tasks.length === 0) {
      throw new ServiceUnavailableException(
        `Bu kapsamda (${scope}) "${componentName}" component'i için task bulunamadı.`,
      );
    }

    const inputHash = this.computeHash(tasks);

    if (!force) {
      const cached = await this.prisma.compIssueSummary.findUnique({
        where: { componentName_scope: { componentName, scope } },
      });
      if (cached && cached.inputHash === inputHash) {
        return this.toDto(cached, tasks.length, false);
      }
    }

    const isAvailable = await this.ollama.isAvailable(config);
    if (!isAvailable) {
      throw new ServiceUnavailableException(
        'Ollama erişilemiyor. Yerel Ollama servisinin çalıştığından emin olun (localhost:11434).',
      );
    }

    const prompt = this.buildPrompt(componentName, scope, tasks);
    const model = config?.model || 'llama3.2';
    const summaryConfig: Partial<OllamaConfig> = {
      ...config,
      model,
      numPredict: SUMMARY_NUM_PREDICT,
      temperature: 0.2,
      timeoutMs: SUMMARY_TIMEOUT_MS,
      format: 'json',
    };

    let raw = '';
    try {
      raw = await this.ollama.generateCompletion(prompt, summaryConfig);
    } catch (err) {
      this.logger.error(`Ollama generateCompletion failed: ${err}`);
      throw new ServiceUnavailableException(
        'Ollama özet üretirken hata verdi. Lütfen tekrar deneyin.',
      );
    }

    const { summary, focusAreas } = this.parseLlmOutput(raw);

    const upserted = await this.prisma.compIssueSummary.upsert({
      where: { componentName_scope: { componentName, scope } },
      create: {
        componentName,
        scope,
        summary,
        focusAreas: JSON.stringify(focusAreas),
        taskCount: tasks.length,
        inputHash,
        model,
      },
      update: {
        summary,
        focusAreas: JSON.stringify(focusAreas),
        taskCount: tasks.length,
        inputHash,
        model,
      },
    });

    return this.toDto(upserted, tasks.length, false);
  }

  private toDto(
    row: {
      componentName: string;
      scope: string;
      summary: string;
      focusAreas: string;
      taskCount: number;
      inputHash: string;
      model: string;
      createdAt: Date;
      updatedAt: Date;
    },
    currentTaskCount: number,
    isStale: boolean,
  ): CompIssueSummaryDto {
    let focusAreas: string[] = [];
    try {
      const parsed = JSON.parse(row.focusAreas);
      if (Array.isArray(parsed)) focusAreas = parsed.filter((x) => typeof x === 'string');
    } catch {
      focusAreas = [];
    }
    return {
      componentName: row.componentName,
      scope: row.scope as SummaryScope,
      summary: row.summary,
      focusAreas,
      taskCount: row.taskCount,
      inputHash: row.inputHash,
      model: row.model,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      isStale,
      currentTaskCount,
    };
  }

  private buildPrompt(
    componentName: string,
    scope: SummaryScope,
    tasks: {
      id: number;
      title: string;
      description: string | null;
      status: string | null;
      severity: string | null;
    }[],
  ): string {
    const limited = tasks.slice(0, MAX_TASKS_IN_PROMPT);
    const omitted = tasks.length - limited.length;

    const ticketBlocks = limited
      .map((t, idx) => {
        const desc = (t.description || '').replace(/\s+/g, ' ').trim().slice(0, MAX_DESC_CHARS);
        const sev = t.severity ? ` [severity: ${t.severity}]` : '';
        const st = t.status ? ` [status: ${t.status}]` : '';
        return `Ticket ${idx + 1} (#${t.id})${sev}${st}\nBaşlık: ${t.title}\nAçıklama: ${desc || '(boş)'}\n`;
      })
      .join('\n---\n');

    const scopeLabel = scope === 'open' ? 'açık (henüz çözülmemiş)' : 'tüm (açık + kapalı)';
    const moreNote = omitted > 0 ? `\n\nNot: Toplam ${tasks.length} ticket var, sadece ilk ${limited.length} tanesi gösterildi (${omitted} tane daha mevcut).` : '';

    return `Sen bir teknik analiz uzmanısın. Aşağıda "${componentName}" UI component'i için açılmış ${scopeLabel} ticketların başlıkları ve açıklamaları var. Bunları okuyup geliştiricinin nelere odaklanması gerektiğini Türkçe özetle.

Şu kurallara uy:
- Genel sorun temalarını grupla (örn: performans, görünüm, davranış, erişilebilirlik, API uyumu).
- En sık tekrarlayan/etkili sorunları öne çıkar.
- Spesifik teknik detayları kullan, genel laf etme.
- 5-8 cümlelik kısa bir paragraf yaz, ardından "focusAreas" olarak 3-6 madde halinde odaklanılacak konuları listele.
- Yanıtını SADECE şu JSON formatında ver, başka hiçbir şey yazma (markdown, açıklama, selamlama YOK):

{"summary": "Markdown formatında özet metni...", "focusAreas": ["odak 1", "odak 2", "odak 3"]}

Ticketlar:
${ticketBlocks}${moreNote}

SADECE JSON:`;
  }

  private parseLlmOutput(raw: string): { summary: string; focusAreas: string[] } {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');

    // Try to find JSON object - match outermost braces
    const jsonMatch = cleaned.match(/\{[\s\S]*?\}(?=\s*$|[\r\n])/);
    const candidate = jsonMatch ? jsonMatch[0] : cleaned;

    try {
      const parsed = JSON.parse(candidate);
      const summary =
        typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
      const focusAreas = Array.isArray(parsed.focusAreas)
        ? parsed.focusAreas.filter((x: unknown) => typeof x === 'string')
        : [];
      if (summary) {
        return { summary, focusAreas };
      }
    } catch (parseError) {
      this.logger.warn(
        `LLM JSON parse failed: ${parseError}, raw: ${raw.slice(0, 200)}...`,
      );
    }

    // Fallback: try to extract any meaningful text as summary
    const textFallback =
      cleaned.replace(/\{[\s\S]*\}/g, '').trim() || raw.trim();

    return { summary: textFallback, focusAreas: [] };
  }
}
