import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LocalLlmService } from './local-llm.service';
import { OllamaService } from './ollama.service';
import { OllamaClientService } from './ollama-client.service';
import { ComponentDetectorService } from './component-detector.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    LocalLlmService,
    OllamaService,
    OllamaClientService,
    ComponentDetectorService,
  ],
  exports: [OllamaService],
})
export class AiModule {}
