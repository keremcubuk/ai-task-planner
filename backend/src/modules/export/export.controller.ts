import { Controller, Get, Res, Query } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportFilter } from '../../shared/types/common.types';
import * as express from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('xlsx')
  async exportXlsx(
    @Res() res: express.Response,
    @Query() query: ExportFilter & { type?: 'raw' | 'stats' },
  ) {
    const type = query.type || 'raw';
    const filter: ExportFilter = {
      status: query.status,
      severity: query.severity,
    };
    const result = await this.exportService.exportToXlsx(filter, type);
    res.download(result.filePath, result.fileName);
  }
}
