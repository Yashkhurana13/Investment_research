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
  sentimentScore: number;
  newsSummary: string;
  catalysts: string[];
}

export interface FinancialMetricsOutput {
  peRatio: FactRecord<number>;
  revenueGrowthYOY: FactRecord<number>;
  debtToEquity: FactRecord<number>;
  grossMargin: FactRecord<number>;
  freeCashFlow: FactRecord<number>;
}

export interface RiskAssessmentOutput {
  macroRisks: string[];
  microRisks: string[];
  regulatoryConcerns: string[];
}

export interface ScoringOutput {
  totalScore: number;
  category: ScoreCategory;
  breakdown: Record<string, number>;
}

export interface EvidencePackage {
  asset: string;
  financials: FinancialMetricsOutput;
  research: CompanyResearchOutput;
  risks: RiskAssessmentOutput;
  score: ScoringOutput;
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
