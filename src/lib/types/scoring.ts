import { ScoreCategory } from '@prisma/client';
import { 
  FinancialMetricsOutput, 
  CompanyResearchOutput, 
  RiskAssessmentOutput 
} from '../graph/state';

export interface ScoringEngineInput {
  financials: FinancialMetricsOutput;
  research: CompanyResearchOutput;
  risks: RiskAssessmentOutput;
}

export interface DetailedScoringOutput {
  financialHealthScore: number;
  growthScore: number;
  riskScore: number;
  sentimentScore: number;
  totalScore: number;
  recommendation: ScoreCategory;
}
