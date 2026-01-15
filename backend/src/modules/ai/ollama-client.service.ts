import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

@Injectable()
export class OllamaClientService {
  private readonly logger = new Logger(OllamaClientService.name);

  private readonly defaultConfig: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  };

  async isAvailable(config?: Partial<OllamaConfig>): Promise<boolean> {
    const baseUrl = config?.baseUrl || this.defaultConfig.baseUrl;

    return new Promise((resolve) => {
      const url = new URL(baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 3000,
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  async generateCompletion(
    prompt: string,
    config?: Partial<OllamaConfig>,
  ): Promise<string> {
    const baseUrl = config?.baseUrl || this.defaultConfig.baseUrl;
    const model = config?.model || this.defaultConfig.model;

    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl);
      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0,
          num_predict: 100,
        },
      });

      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 30000,
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.response) {
              resolve(parsed.response);
            } else {
              this.logger.warn('No response field in Ollama output');
              resolve('');
            }
          } catch (error) {
            this.logger.error(`Failed to parse Ollama response: ${error}`);
            resolve('');
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`Ollama request failed: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        this.logger.error('Ollama request timeout');
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  async extractComponentsWithLLM(
    text: string,
    config?: Partial<OllamaConfig>,
  ): Promise<string[]> {
    const prompt = `Analyze the following text and extract UI component names mentioned in it.
UI components are things like: button, modal, dialog, bottom sheet, label, input, dropdown, card, list, table, etc.
Return ONLY a JSON array of component names found, nothing else. If no components found, return [].
Example output: ["bottom sheet", "label value", "button"]

Text to analyze: "${text}"

JSON array:`;

    try {
      const response = await this.generateCompletion(prompt, config);
      const cleaned = response
        .trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string');
        }
      } catch {
        this.logger.warn(`Failed to parse LLM response as JSON: ${cleaned}`);
      }

      return [];
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error}`);
      return [];
    }
  }
}
