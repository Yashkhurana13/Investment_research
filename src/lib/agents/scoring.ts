import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { ScoringEngineInput } from '../types/scoring';
import { ScoreCategory } from '@prisma/client';
import { ScoringOutput, RiskSeverity } from '../graph/state';

export class ScoringAgent extends BaseAgent<ScoringEngineInput, ScoringOutput> {
  readonly metadata: AgentMetadata = {
    name: 'ScoringEngine',
    description: 'Calculates a deterministic investment score with severity-weighted risks.',
    version: '2.0.0',
  };

  protected validateInput(context: AgentContext, input: ScoringEngineInput): boolean {
    return !!input.financials && !!input.research && !!input.risks;
  }

  protected async execute(context: AgentContext, input: ScoringEngineInput): Promise<ScoringOutput> {
    const financialHealthScore = this.calculateFinancialHealth(input.financials);
    const growthScore = this.calculateGrowth(input.financials, input.research);
    const riskScore = this.calculateRisk(input.risks);
    const sentimentScore = this.calculateSentiment(input.research);

    let totalScore = financialHealthScore + growthScore + riskScore + sentimentScore;
    
    totalScore = Math.max(0, Math.min(10.0, totalScore));
    totalScore = parseFloat(totalScore.toFixed(2));

    let recommendation: ScoreCategory = ScoreCategory.PASS;
    if (totalScore >= 8.0) {
      recommendation = ScoreCategory.INVEST;
    } else if (totalScore >= 5.0) {
      recommendation = ScoreCategory.WATCHLIST;
    }

    return {
      financialHealthScore: parseFloat(financialHealthScore.toFixed(2)),
      growthScore: parseFloat(growthScore.toFixed(2)),
      riskScore: parseFloat(riskScore.toFixed(2)),
      sentimentScore: parseFloat(sentimentScore.toFixed(2)),
      totalScore,
      recommendation,
    };
  }

  private calculateFinancialHealth(f: ScoringEngineInput['financials']): number {
    let score = 0;
    
    const pe = f.peRatio?.value || 0;
    if (pe > 0 && pe <= 15) score += 0.7;
    else if (pe > 15 && pe <= 25) score += 0.5;
    else if (pe > 25 && pe <= 40) score += 0.3;
    else score += 0.1;

    const de = f.debtToEquity?.value || 0;
    if (de <= 0.5) score += 0.7;
    else if (de <= 1.0) score += 0.5;
    else if (de <= 2.0) score += 0.3;
    else score += 0.1;

    const gm = f.grossMargin?.value || 0;
    if (gm >= 0.5) score += 0.7;
    else if (gm >= 0.3) score += 0.5;
    else if (gm >= 0.1) score += 0.3;
    else score += 0.1;

    const fcf = f.freeCashFlow?.value || 0;
    if (fcf > 0) score += 0.7;
    else score += 0.1;

    const cr = f.currentRatio?.value || 0;
    if (cr >= 2.0) score += 0.7;
    else if (cr >= 1.0) score += 0.5;
    else score += 0.1;

    return Math.min(3.5, score);
  }

  private calculateGrowth(f: ScoringEngineInput['financials'], r: ScoringEngineInput['research']): number {
    let score = 0;

    const revGrowth = f.revenueGrowthYOY?.value || 0;
    if (revGrowth >= 0.2) score += 1.0;
    else if (revGrowth >= 0.1) score += 0.7;
    else if (revGrowth > 0) score += 0.4;
    else score += 0.0;

    const catalysts = r.catalysts?.length || 0;
    if (catalysts >= 2) score += 1.0;
    else if (catalysts === 1) score += 0.5;
    else score += 0.0;

    const keywords = ['expansion', 'international', 'new market', 'acquisition', 'launch'];
    let hasExpansion = false;
    for (const c of (r.catalysts || [])) {
      if (keywords.some(k => c.value.toLowerCase().includes(k))) {
        hasExpansion = true;
        break;
      }
    }
    if (hasExpansion) {
      score += 0.5;
    }

    return Math.min(2.5, score);
  }

  private calculateRisk(r: ScoringEngineInput['risks']): number {
    let score = 2.5;

    const getDeduction = (severity: RiskSeverity, type: 'regulatory' | 'macro' | 'competitive'): number => {
      if (type === 'regulatory') {
        switch (severity) {
          case RiskSeverity.LOW: return 0.2;
          case RiskSeverity.MEDIUM: return 0.5;
          case RiskSeverity.HIGH: return 0.8;
          case RiskSeverity.CRITICAL: return 1.0;
        }
      } else {
        switch (severity) {
          case RiskSeverity.LOW: return 0.1;
          case RiskSeverity.MEDIUM: return 0.3;
          case RiskSeverity.HIGH: return 0.5;
          case RiskSeverity.CRITICAL: return 0.8;
        }
      }
      return 0;
    };

    let regDeduction = 0;
    for (const risk of r.regulatoryConcerns || []) regDeduction += getDeduction(risk.severity, 'regulatory');
    score -= Math.min(1.0, regDeduction);

    let macroDeduction = 0;
    for (const risk of r.macroRisks || []) macroDeduction += getDeduction(risk.severity, 'macro');
    score -= Math.min(0.6, macroDeduction);

    let compDeduction = 0;
    for (const risk of r.microRisks || []) compDeduction += getDeduction(risk.severity, 'competitive');
    score -= Math.min(0.9, compDeduction);

    return Math.max(0, score);
  }

  private calculateSentiment(r: ScoringEngineInput['research']): number {
    let score = 0;
    const sent = r.sentimentScore?.value || 0; 
    score += (sent / 100) * 1.0;
    const conf = r.sentimentScore?.metadata?.confidenceWeight || 0.5;
    score += conf * 0.5;
    return Math.min(1.5, score);
  }
}
