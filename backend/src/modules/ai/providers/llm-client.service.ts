
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { RATE_LIMIT_WAIT_MS } from '../shared/ai.constants.js';

interface UsageDetails {
  input_tokens?: number;
  output_tokens?: number;
  output_tokens_details?: {
    reasoning_tokens?: number | null;
  } | null;
}

const MAX_INLINE_RETRY_WAIT_MS = 8_000;

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);

  readonly client: OpenAI | null;
  readonly model: string;

  constructor(configService: ConfigService) {
    const apiKey = configService
      .get<string>('GROQ_API_KEY')
      ?.trim();

    this.model =
      configService.get<string>('GROQ_MODEL') ||
      'openai/gpt-oss-20b';

    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
          timeout: 30_000,

          // Retry handling is centralized in withRateLimitRetry().
          // Avoid extra SDK retries when the daily quota is exhausted.
          maxRetries: 0,
        })
      : null;

    if (!this.client) {
      this.logger.warn(
        'GROQ_API_KEY is missing. AI features are unavailable.',
      );
    }
  }

  /**
   * Indicates whether an API client is configured.
   * It does not guarantee that the provider is reachable.
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Retries a short, temporary rate limit once.
   * Daily quota exhaustion and long retry windows fail fast,
   * allowing the calling service to use its fallback.
   */
  async withRateLimitRetry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (this.getStatusCode(error) !== 429) {
        throw error;
      }

      if (this.isDailyTokenLimitError(error)) {
        this.logger.warn(
          'Groq daily token limit reached. Skipping retry; the caller can use its fallback.',
        );
        throw error;
      }

      const retryDelayMs =
        this.getRetryDelayMs(error) ?? RATE_LIMIT_WAIT_MS;

      if (retryDelayMs > MAX_INLINE_RETRY_WAIT_MS) {
        this.logger.warn(
          `Rate limit retry window is ${Math.ceil(
            retryDelayMs / 1000,
          )}s; skipping inline retry so the caller can use its fallback.`,
        );
        throw error;
      }

      this.logger.warn(
        `Temporary rate limit (429); retrying once in ${retryDelayMs}ms.`,
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, retryDelayMs);
      });

      // If the retry fails, let the caller handle the error.
      return operation();
    }
  }

  private isDailyTokenLimitError(error: unknown): boolean {
    const message = this.getErrorMessage(error);

    return (
      /\bTPD\b/i.test(message) ||
      /tokens per day/i.test(message) ||
      /daily token (?:limit|quota)/i.test(message)
    );
  }

  /**
   * Read Retry-After metadata first, then the provider's
   * "Please try again in 4m30s" message, if available.
   */
  private getRetryDelayMs(error: unknown): number | undefined {
    const retryAfterMs = this.getHeader(error, 'retry-after-ms');

    if (retryAfterMs && /^\d+(?:\.\d+)?$/.test(retryAfterMs)) {
      return Math.max(0, Math.ceil(Number(retryAfterMs)));
    }

    const retryAfter = this.getHeader(error, 'retry-after');

    if (retryAfter) {
      const seconds = Number(retryAfter);

      if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.ceil(seconds * 1000);
      }

      const timestamp = Date.parse(retryAfter);

      if (Number.isFinite(timestamp)) {
        return Math.max(0, timestamp - Date.now());
      }
    }

    const message = this.getErrorMessage(error);

    const match =
      /try again in\s+(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?\s*(?:(\d+(?:\.\d+)?)\s*s)?/i.exec(
        message,
      );

    if (!match || !(match[1] || match[2] || match[3])) {
      return undefined;
    }

    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[2] ?? 0);
    const seconds = Number(match[3] ?? 0);

    return Math.ceil(
      (hours * 3600 + minutes * 60 + seconds) * 1000,
    );
  }

  private getHeader(
    error: unknown,
    name: string,
  ): string | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const record = error as {
      headers?: unknown;
    };

    const headers = record.headers;

    if (typeof headers !== 'object' || headers === null) {
      return undefined;
    }

    const headerRecord = headers as {
      get?: (key: string) => string | null;
      [key: string]: unknown;
    };

    if (typeof headerRecord.get === 'function') {
      const value = headerRecord.get(name);
      if (value) return value;
    }

    const matchingKey = Object.keys(headerRecord).find(
      (key) => key.toLowerCase() === name.toLowerCase(),
    );

    const value = matchingKey
      ? headerRecord[matchingKey]
      : undefined;

    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Log token usage without logging prompts or author messages.
   */
  logUsage(
    label: string,
    usage: UsageDetails | null | undefined,
    elapsedMs: number,
  ): void {
    this.logger.log(
      `${label}: ` +
        `in=${usage?.input_tokens ?? '?'} ` +
        `out=${usage?.output_tokens ?? '?'} ` +
        `reasoning=${
          usage?.output_tokens_details?.reasoning_tokens ?? '?'
        } ` +
        `${elapsedMs}ms model=${this.model}`,
    );
  }

  getStatusCode(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const record = error as {
      status?: unknown;
      statusCode?: unknown;
    };

    const value = record.status ?? record.statusCode;

    return typeof value === 'number' ? value : undefined;
  }

  getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Unknown error';
  }
}
