import { AgentContext, AgentResult, AgentExecutionStatus, AgentMetadata } from './types';
import { retryWithBackoff } from '../core/retry';
import { AppError, TimeoutError, ValidationError } from '../core/errors';

export interface AgentConfig {
  maxRetries?: number;
  timeoutMs?: number;
}

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly metadata: AgentMetadata;
  protected config: AgentConfig = { maxRetries: 3, timeoutMs: 30000 };

  protected abstract validateInput(context: AgentContext, input: TInput): boolean;
  protected abstract execute(context: AgentContext, input: TInput): Promise<TOutput>;

  // Optional method for fallback
  protected async executeFallback?(context: AgentContext, input: TInput): Promise<TOutput>;

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new TimeoutError(`Execution timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
  }

  public async run(context: AgentContext, input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    let retryCount = 0;
    let fallbackUsed = false;
    let failureReason: string | undefined;
    let status: AgentExecutionStatus = 'FAILED';
    let data: TOutput | undefined;
    const errors: string[] = [];

    try {
      if (!this.validateInput(context, input)) {
        throw new ValidationError('Input validation failed');
      }

      // Try Primary
      try {
        data = await retryWithBackoff(
          () => this.withTimeout(this.execute(context, input), this.config.timeoutMs!),
          { maxRetries: this.config.maxRetries! },
          (err, attempt) => { retryCount = attempt; }
        );
        status = 'SUCCESS';
      } catch (err: any) {
        if (!this.executeFallback) {
          throw err; // No fallback available, propagate failure
        }
        
        // Try Fallback
        fallbackUsed = true;
        retryCount = 0; // Reset for fallback
        data = await retryWithBackoff(
          () => this.withTimeout(this.executeFallback!(context, input), this.config.timeoutMs!),
          { maxRetries: this.config.maxRetries! },
          (err, attempt) => { retryCount = attempt; }
        );
        status = 'SUCCESS';
      }

    } catch (err: any) {
      status = 'FAILED';
      failureReason = err.message;
      if (err instanceof AppError) {
        errors.push(`[${err.code}] ${err.message}`);
      } else {
        errors.push(err.message || 'Unknown error occurred');
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      status,
      data,
      errors: errors.length > 0 ? errors : undefined,
      executionTimeMs,
      metadata: this.metadata,
      retryCount,
      failureReason,
      fallbackUsed
    };
  }
}
