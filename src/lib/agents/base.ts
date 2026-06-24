import { AgentContext, AgentResult, AgentMetadata } from './types';
import { trackExecutionTime, logAgentStatus } from './utils';
import { saveAgentOutput } from '../database/db';

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly metadata: AgentMetadata;

  protected abstract validateInput(context: AgentContext, input: TInput): boolean | Promise<boolean>;
  
  protected abstract execute(context: AgentContext, input: TInput): Promise<TOutput>;

  public async run(context: AgentContext, input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    logAgentStatus(this.metadata.name, 'RUNNING');

    try {
      const isValid = await this.validateInput(context, input);
      if (!isValid) {
        throw new Error(`Validation failed for agent: ${this.metadata.name}`);
      }

      const data = await this.execute(context, input);
      const executionTimeMs = trackExecutionTime(startTime);

      const result: AgentResult<TOutput> = {
        status: 'SUCCESS',
        data,
        executionTimeMs,
        metadata: this.metadata,
      };

      // Best effort tracking of execution in database
      if (context.analysisId) {
        try {
          await saveAgentOutput(
            context.analysisId,
            this.metadata.name,
            data as any,
            new Date(startTime),
            new Date(),
            executionTimeMs
          );
        } catch (dbError) {
          console.error(`Failed to save agent output for ${this.metadata.name}:`, dbError);
        }
      }

      logAgentStatus(this.metadata.name, 'SUCCESS', executionTimeMs);
      return result;
    } catch (error: any) {
      const executionTimeMs = trackExecutionTime(startTime);
      logAgentStatus(this.metadata.name, 'FAILED', executionTimeMs, error.message);

      return {
        status: 'FAILED',
        errors: [error.message || 'Unknown error occurred'],
        executionTimeMs,
        metadata: this.metadata,
      };
    }
  }
}
