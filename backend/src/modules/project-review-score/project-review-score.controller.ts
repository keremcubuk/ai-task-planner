import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProjectReviewScoreService } from './project-review-score.service';

@Controller('project-review-scores')
export class ProjectReviewScoreController {
  constructor(
    private readonly reviewScoreService: ProjectReviewScoreService,
  ) {}

  @Get()
  async getAllScores() {
    return this.reviewScoreService.getAllScores();
  }

  @Get(':projectName')
  async getProjectDetail(
    @Param('projectName') projectName: string,
    @Query('scoreId') scoreId?: string,
  ) {
    const decodedName = decodeURIComponent(projectName);
    const detail = await this.reviewScoreService.getScoreDetail(
      decodedName,
      scoreId ? parseInt(scoreId, 10) : undefined,
    );

    if (!detail) {
      throw new BadRequestException(
        `No review score found for project: ${decodedName}`,
      );
    }

    return detail;
  }

  @Get(':projectName/history')
  async getProjectHistory(@Param('projectName') projectName: string) {
    const decodedName = decodeURIComponent(projectName);
    return this.reviewScoreService.getProjectScores(decodedName);
  }

  @Post('crawl')
  async crawlReviewScore(
    @Body() body: { url: string; cookies?: string },
  ) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    try {
      new URL(body.url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.reviewScoreService.crawlReviewScore(body.url, body.cookies);
  }

  @Post('save')
  async saveReviewScore(
    @Body()
    body: {
      parsed: any;
      confluenceUrl?: string;
    },
  ) {
    if (!body.parsed) {
      throw new BadRequestException('Parsed review data is required');
    }

    return this.reviewScoreService.saveReviewScore(
      body.parsed,
      body.confluenceUrl,
    );
  }

  @Post('import-markdown')
  async importFromMarkdown(
    @Body() body: { markdown: string; confluenceUrl?: string },
  ) {
    if (!body.markdown) {
      throw new BadRequestException('Markdown content is required');
    }

    return this.reviewScoreService.importFromMarkdown(
      body.markdown,
      body.confluenceUrl,
    );
  }

  @Delete(':id')
  async deleteScore(@Param('id') id: string) {
    const scoreId = parseInt(id, 10);
    if (isNaN(scoreId)) {
      throw new BadRequestException('Invalid score ID');
    }
    return this.reviewScoreService.deleteScore(scoreId);
  }
}
