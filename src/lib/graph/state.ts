import { AnalysisStatus, ScoreCategory } from '../types';

export interface SourceMetadata {
  source: string;
  url: string;
  retrievedAt: string;
  confidenceWeight: number;
}

export interface FactRecord<T> {
  value: T;
  metadata: SourceMetadata;
}

export interface CompanyResearchOutput {
  sentimentScore: FactRecord<number>;
  newsSummary: FactRecord<string>;
  catalysts: FactRecord<string>[];
}

export interface FinancialMetricsOutput {
  peRatio: FactRecord<number>;
  revenueGrowthYOY: FactRecord<number>;
  debtToEquity: FactRecord<number>;
  grossMargin: FactRecord<number>;
  freeCashFlow: FactRecord<number>;
  currentRatio?: FactRecord<number>;
}

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface RiskRecord {
  value: string;
  severity: RiskSeverity;
  metadata: SourceMetadata;
}

export interface RiskAssessmentOutput {
  macroRisks: RiskRecord[];
  microRisks: RiskRecord[];
  regulatoryConcerns: RiskRecord[];
}

export interface ScoringOutput {
  financialHealthScore: number;
  growthScore: number;
  riskScore: number;
  sentimentScore: number;
  totalScore: number;
  recommendation: ScoreCategory;
}

export interface EvidencePackage {
  company: {
    ticker: string;
    companyName?: string;
  };
  financials: FinancialMetricsOutput;
  research: CompanyResearchOutput;
  risks: RiskAssessmentOutput;
  scoring: ScoringOutput;
  strengths: string[];
  weaknesses: string[];
  evidenceQualityScore: number;
  confidenceScore: number;
}

export interface JudgeVerdict {
  recommendation: ScoreCategory;
  confidenceScore: number;
  justification: string;
}

export interface ResearchGraphState {
  rawQuery: string;
  resolvedTicker?: string;
  
  companyResearch?: CompanyResearchOutput;
  financialMetrics?: FinancialMetricsOutput;
  riskAssessment?: RiskAssessmentOutput;
  
  scoringResult?: ScoringOutput;
  evidencePackage?: EvidencePackage;
  
  bullThesis?: string;
  bearThesis?: string;
  
  judgeVerdict?: JudgeVerdict;
  humanReviewStatus: 'Not Required' | 'Pending' | 'Resolved';
  
  finalReportMarkdown?: string;
  errors: string[];
}
