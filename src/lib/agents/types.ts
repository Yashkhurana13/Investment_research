import { AgentName } from '../types';

export interface AgentContext {
  analysisId: string;
  rawQuery: string;
  resolvedTicker?: string;
  timestamp: string;
}

export type AgentExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface AgentMetadata {
  name: AgentName;
  description: string;
  version: string;
}

export interface AgentResult<T> {
  status: AgentExecutionStatus;
  data?: T;
  errors?: string[];
  executionTimeMs: number;
  metadata: AgentMetadata;
}
