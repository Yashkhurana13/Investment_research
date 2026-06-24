import { AnalysisStatus, ScoreCategory } from '@prisma/client';

export { AnalysisStatus, ScoreCategory };

export type AgentName =
  | 'TickerResolver'
  | 'CompanyResearch'
  | 'FinancialAgent'
  | 'RiskAgent'
  | 'ScoringEngine'
  | 'EvidenceCollector'
  | 'BullAgent'
  | 'BearAgent'
  | 'JudgeAgent'
  | 'ReportGenerator'
  | 'ManagerAgent';
