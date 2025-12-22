import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ConfluenceService } from './confluence.service';
import type {
  ConfluenceCrawlRequest,
  ConfluenceConfirmRequest,
} from './confluence.service';

@Controller('confluence')
export class ConfluenceController {
  constructor(private readonly confluenceService: ConfluenceService) {}

  @Post('crawl')
  async crawl(@Body() body: ConfluenceCrawlRequest) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    // URL validasyonu
    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.confluenceService.crawlPage(body.url, body.cookies);
  }

  @Post('confirm')
  async confirm(@Body() body: ConfluenceConfirmRequest) {
    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      throw new BadRequestException('Tasks array is required');
    }

    return this.confluenceService.confirmAndSaveTasks(body.tasks);
  }

  @Post('extract-cookies')
  async extractCookies(@Body() body: { baseUrl: string }) {
    if (!body.baseUrl) {
      throw new BadRequestException('Base URL is required');
    }

    // URL validasyonu
    try {
      new URL(body.baseUrl);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.confluenceService.extractCookiesWithLogin(body.baseUrl);
  }
}
