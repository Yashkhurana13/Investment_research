import { AgentName } from '../types';
import { AgentExecutionStatus } from './types';
import { SourceMetadata } from '../graph/state';

export function trackExecutionTime(startTimeMs: number): number {
  return Date.now() - startTimeMs;
}

export function logAgentStatus(
  agentName: AgentName,
  status: AgentExecutionStatus,
  executionTimeMs?: number,
  errorMessage?: string
): void {
  const timeStr = executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
  const errorStr = errorMessage ? ` - Error: ${errorMessage}` : '';
  
  const statusColors = {
    PENDING: '\x1b[33m', // Yellow
    RUNNING: '\x1b[34m', // Blue
    SUCCESS: '\x1b[32m', // Green
    FAILED: '\x1b[31m',  // Red
  };
  
  const color = statusColors[status] || '\x1b[0m';
  const reset = '\x1b[0m';

  console.log(`${color}[${agentName}] ${status}${reset}${timeStr}${errorStr}`);
}

export function createSourceMetadata(
  source: string,
  url: string,
  confidenceWeight: number = 1.0
): SourceMetadata {
  return {
    source,
    url,
    confidenceWeight,
    retrievedAt: new Date().toISOString(),
  };
}
