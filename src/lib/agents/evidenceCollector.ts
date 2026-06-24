import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { 
  EvidencePackage, 
  FinancialMetricsOutput, 
  CompanyResearchOutput, 
  RiskAssessmentOutput, 
  ScoringOutput,
  RiskSeverity
} from '../graph/state';

export interface EvidenceCollectorInput {
  ticker: string;
  companyName?: string;
  financials: FinancialMetricsOutput;
  research: CompanyResearchOutput;
  risks: RiskAssessmentOutput;
  scoring: ScoringOutput;
}

export class EvidenceCollectorAgent extends BaseAgent<EvidenceCollectorInput, EvidencePackage> {
  readonly metadata: AgentMetadata = {
    name: 'EvidenceCollector',
    description: 'Combines all agent outputs into a normalized EvidencePackage.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: EvidenceCollectorInput): boolean {
    return !!input.ticker && !!input.financials && !!input.research && !!input.risks && !!input.scoring;
  }

  protected async execute(context: AgentContext, input: EvidenceCollectorInput): Promise<EvidencePackage> {
    const strengths = this.extractStrengths(input);
    const weaknesses = this.extractWeaknesses(input);
    
    const evidenceQualityScore = this.calculateQualityScore(input);
    const confidenceScore = this.calculateConfidenceScore(input, evidenceQualityScore);

    return {
      company: {
        ticker: input.ticker,
        companyName: input.companyName,
      },
      financials: input.financials,
      research: input.research,
      risks: input.risks,
      scoring: input.scoring,
      strengths,
      weaknesses,
      evidenceQualityScore,
      confidenceScore,
    };
  }

  private extractStrengths(input: EvidenceCollectorInput): string[] {
    const strengths: string[] = [];
    const { financials, research } = input;

    if (financials.revenueGrowthYOY?.value >= 0.20) strengths.push('Revenue Growth > 20%');
    if (financials.freeCashFlow?.value > 0) strengths.push('Positive Free Cash Flow');
    if (financials.grossMargin?.value >= 0.50) strengths.push('Strong Gross Margin (>=50%)');
    if (research.sentimentScore?.value >= 70) strengths.push('Positive Market Sentiment');
    if ((research.catalysts?.length || 0) >= 2) strengths.push('Multiple Growth Catalysts');

    return strengths;
  }

  private extractWeaknesses(input: EvidenceCollectorInput): string[] {
    const weaknesses: string[] = [];
    const { financials, research, risks } = input;

    if (financials.debtToEquity?.value > 2.0) weaknesses.push('High Debt to Equity (> 2.0)');
    if (financials.freeCashFlow?.value <= 0) weaknesses.push('Negative or Zero Free Cash Flow');
    if (financials.revenueGrowthYOY?.value <= 0) weaknesses.push('Weak or Negative Revenue Growth');
    if (research.sentimentScore?.value <= 40) weaknesses.push('Negative Market Sentiment');

    const hasCriticalRisk = [
      ...(risks.macroRisks || []),
      ...(risks.microRisks || []),
      ...(risks.regulatoryConcerns || [])
    ].some(r => r.severity === RiskSeverity.CRITICAL);

    if (hasCriticalRisk) weaknesses.push('Critical Risk Identified');

    return weaknesses;
  }

  private calculateQualityScore(input: EvidenceCollectorInput): number {
    let score = 100;

    // Check data completeness
    if (input.financials.peRatio?.value === 0 || input.financials.peRatio?.value === null) score -= 10;
    if (input.financials.freeCashFlow?.value === 0 || input.financials.freeCashFlow?.value === null) score -= 10;
    if ((input.research.catalysts?.length || 0) === 0) score -= 10;

    // We can also average the confidence weights from the metadata
    const weights = [
      input.financials.peRatio?.metadata?.confidenceWeight,
      input.research.sentimentScore?.metadata?.confidenceWeight,
      input.risks.macroRisks?.[0]?.metadata?.confidenceWeight
    ].filter(w => w !== undefined) as number[];

    if (weights.length > 0) {
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      // if avg confidence is low (e.g. 0.7), deduct points
      if (avgWeight < 0.9) score -= 10;
      if (avgWeight < 0.8) score -= 20;
    } else {
      score -= 30; // no sources
    }

    return Math.max(0, score);
  }

  private calculateConfidenceScore(input: EvidenceCollectorInput, qualityScore: number): number {
    let score = qualityScore;

    // Check agreement between signals
    const isFinanciallyStrong = input.scoring.financialHealthScore >= 2.5;
    const isResearchPositive = input.scoring.sentimentScore >= 1.0;
    
    const hasCriticalRisk = [
      ...(input.risks.macroRisks || []),
      ...(input.risks.microRisks || []),
      ...(input.risks.regulatoryConcerns || [])
    ].some(r => r.severity === RiskSeverity.CRITICAL);

    if (isFinanciallyStrong && isResearchPositive && !hasCriticalRisk) {
      // High agreement
      score = Math.min(100, score + 10);
    } else if (isFinanciallyStrong && hasCriticalRisk) {
      // Conflict
      score -= 20;
    }

    return Math.max(0, score);
  }
}
