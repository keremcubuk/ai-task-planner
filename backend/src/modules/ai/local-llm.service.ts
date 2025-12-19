import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

interface LlmConfig {
  localLlmPath: string;
  modelPath: string;
}

@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);

  async generatePriority(
    taskDescription: string,
    config: LlmConfig,
  ): Promise<number> {
    const { localLlmPath, modelPath } = config;

    if (!localLlmPath || !modelPath) {
      this.logger.warn('Local LLM path or model path not configured');
      return 0;
    }

    const prompt = `
    Analyze the priority of this task on a scale of 0 to 100 based on urgency and importance.
    Task: ${taskDescription}
    Return ONLY the number.
    `;

    return new Promise((resolve) => {
      // Example for llama.cpp: ./main -m model.gguf -p "prompt" -n 10
      const process = spawn(localLlmPath, [
        '-m',
        modelPath,
        '-p',
        prompt,
        '-n',
        '10',
        '--temp',
        '0',
      ]);

      let output = '';
      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`LLM process exited with code ${code}`);
          resolve(50); // Default fallback
          return;
        }

        // Extract number from output
        const match = output.match(/(\d+)/);
        if (match) {
          const score = parseInt(match[1], 10);
          resolve(Math.min(100, Math.max(0, score)));
        } else {
          resolve(50);
        }
      });

      process.on('error', (err) => {
        this.logger.error('Failed to spawn LLM process', err);
        resolve(50);
      });
    });
  }
}
