import { Module } from '@nestjs/common';
import { ConfluenceController } from './confluence.controller';
import { ConfluenceService } from './confluence.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ConfluenceController],
  providers: [ConfluenceService],
  exports: [ConfluenceService],
})
export class ConfluenceModule {}
