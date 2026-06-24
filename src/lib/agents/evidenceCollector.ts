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
    return !!input.ticker && !!input.financials && !!input.scoring; // Research and risks may be missing
  }

  protected async execute(context: AgentContext, input: EvidenceCollectorInput): Promise<EvidencePackage> {
    const strengths = this.extractStrengths(input);
    const weaknesses = this.extractWeaknesses(input);
    
    let evidenceQualityScore = 90;
    let confidenceScore = 90;

    // Partial success penalization
    if (!input.research) {
      weaknesses.push('WARNING: Company research data unavailable (Dependency failed)');
      evidenceQualityScore -= 20;
      confidenceScore -= 15;
    }

    if (!input.risks) {
      weaknesses.push('WARNING: Risk assessment data unavailable (Dependency failed)');
      evidenceQualityScore -= 20;
      confidenceScore -= 15;
    }

    // Ensure they don't drop below 0
    evidenceQualityScore = Math.max(0, evidenceQualityScore);
    confidenceScore = Math.max(0, confidenceScore);

    return {
      company: {
        ticker: input.ticker,
        companyName: input.companyName,
      },
      financials: input.financials,
      research: input.research as any,
      risks: input.risks as any,
      scoring: input.scoring,
      strengths,
      weaknesses,
      evidenceQualityScore,
      confidenceScore
    };
  }

  private extractStrengths(input: EvidenceCollectorInput): string[] {
    const strengths: string[] = [];
    const { financials, research } = input;

    const revGrowth = financials.revenueGrowthYOY?.value;
    if (revGrowth >= 0.20) strengths.push(`Revenue Growth: ${(revGrowth * 100).toFixed(1)}% (Strong, > 20%)`);
    
    const fcf = financials.freeCashFlow?.value;
    if (fcf > 0) strengths.push(`Free Cash Flow: ${fcf} (Positive)`);
    
    const gm = financials.grossMargin?.value;
    if (gm >= 0.50) strengths.push(`Gross Margin: ${(gm * 100).toFixed(1)}% (Strong, >= 50%)`);
    
    const sent = research.sentimentScore?.value;
    if (sent >= 70) strengths.push(`Market Sentiment: ${sent}/100 (Positive)`);
    
    const cat = research.catalysts?.length || 0;
    if (cat >= 2) strengths.push(`Growth Catalysts: ${cat} potential catalysts identified`);

    return strengths;
  }

  private extractWeaknesses(input: EvidenceCollectorInput): string[] {
    const weaknesses: string[] = [];
    const { financials, research, risks } = input;

    const de = financials.debtToEquity?.value;
    if (de > 2.0) weaknesses.push(`Debt to Equity: ${de} (High, > 2.0)`);
    
    const fcf = financials.freeCashFlow?.value;
    if (fcf <= 0) weaknesses.push(`Free Cash Flow: ${fcf} (Negative or Zero)`);
    
    const revGrowth = financials.revenueGrowthYOY?.value;
    if (revGrowth <= 0) weaknesses.push(`Revenue Growth: ${(revGrowth * 100).toFixed(1)}% (Weak or Negative)`);
    
    const sent = research.sentimentScore?.value;
    if (sent <= 40) weaknesses.push(`Market Sentiment: ${sent}/100 (Negative)`);

    const allRisks = [
      ...(risks.macroRisks || []),
      ...(risks.microRisks || []),
      ...(risks.regulatoryConcerns || [])
    ];
    for (const r of allRisks) {
      if (r.severity === 'CRITICAL') {
        weaknesses.push(`CRITICAL Risk: ${r.value}`);
      } else if (r.severity === 'HIGH') {
        weaknesses.push(`HIGH Risk: ${r.value}`);
      }
    }

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
