import { AnalysisStatus, ScoreCategory } from '../types';
import { Annotation } from '@langchain/langgraph';
import { BullThesisAnalysis, BearThesisAnalysis, JudgeVerdictAnalysis } from '../types/debate';

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

export const ResearchGraphAnnotation = Annotation.Root({
  rawQuery: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  resolvedTicker: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  companyName: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  financialMetrics: Annotation<FinancialMetricsOutput>({
    reducer: (x, y) => y ?? x,
  }),
  companyResearch: Annotation<CompanyResearchOutput>({
    reducer: (x, y) => y ?? x,
  }),
  riskAssessment: Annotation<RiskAssessmentOutput>({
    reducer: (x, y) => y ?? x,
  }),
  scoringResult: Annotation<ScoringOutput>({
    reducer: (x, y) => y ?? x,
  }),
  evidencePackage: Annotation<EvidencePackage>({
    reducer: (x, y) => y ?? x,
  }),
  bullThesis: Annotation<BullThesisAnalysis>({
    reducer: (x, y) => y ?? x,
  }),
  bearThesis: Annotation<BearThesisAnalysis>({
    reducer: (x, y) => y ?? x,
  }),
  judgeVerdict: Annotation<JudgeVerdictAnalysis>({
    reducer: (x, y) => y ?? x,
  }),
  finalReportMarkdown: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
  humanReviewStatus: Annotation<'Not Required' | 'Pending' | 'Resolved'>({
    reducer: (x, y) => y ?? x,
    default: () => 'Not Required',
  }),
  errors: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type ResearchGraphState = typeof ResearchGraphAnnotation.State;
