import { Module } from '@nestjs/common';
import { ProjectReviewScoreController } from './project-review-score.controller';
import { ProjectReviewScoreService } from './project-review-score.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ProjectReviewScoreController],
  providers: [ProjectReviewScoreService],
  exports: [ProjectReviewScoreService],
})
export class ProjectReviewScoreModule {}
