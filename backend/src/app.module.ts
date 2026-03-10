import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { ImportModule } from './modules/import/import.module';
import { ExportModule } from './modules/export/export.module';
import { AiModule } from './modules/ai/ai.module';
import { SharedModule } from './shared/shared.module';
import { ConfluenceModule } from './modules/confluence/confluence.module';
import { ProjectReviewScoreModule } from './modules/project-review-score/project-review-score.module';

@Module({
  imports: [
    TasksModule,
    ImportModule,
    ExportModule,
    AiModule,
    SharedModule,
    ConfluenceModule,
    ProjectReviewScoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
