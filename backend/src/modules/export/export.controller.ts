import { Controller, Get, Res, Query } from '@nestjs/common';
import { ExportService } from './export.service';
import * as express from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('xlsx')
  async exportXlsx(@Res() res: express.Response, @Query() query: any) {
    const type = (query.type as 'raw' | 'stats') || 'raw';
    const result = await this.exportService.exportToXlsx(query, type);
    res.download(result.filePath, result.fileName);
  }
}
