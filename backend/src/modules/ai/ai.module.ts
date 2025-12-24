import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LocalLlmService } from './local-llm.service';
import { OllamaService } from './ollama.service';

@Module({
  controllers: [AiController],
  providers: [AiService, LocalLlmService, OllamaService],
  exports: [OllamaService],
})
export class AiModule {}
