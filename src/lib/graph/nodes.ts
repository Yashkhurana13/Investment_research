import { ResearchGraphAnnotation } from './state';
import { TickerResolverAgent } from '../agents/tickerResolver';
import { FinancialAgent } from '../agents/financial';
import { CompanyResearchAgent } from '../agents/companyResearch';
import { RiskAgent } from '../agents/risk';
import { ScoringAgent } from '../agents/scoring';
import { EvidenceCollectorAgent } from '../agents/evidenceCollector';
import { BullAgent } from '../agents/bull';
import { BearAgent } from '../agents/bear';
import { JudgeAgent } from '../agents/judge';
import { AgentContext } from '../agents/types';

const tickerResolverAgent = new TickerResolverAgent();
const financialAgent = new FinancialAgent();
const companyResearchAgent = new CompanyResearchAgent();
const riskAgent = new RiskAgent();
const scoringAgent = new ScoringAgent();
const evidenceCollectorAgent = new EvidenceCollectorAgent();
const bullAgent = new BullAgent();
const bearAgent = new BearAgent();
const judgeAgent = new JudgeAgent();

const getContext = (state: typeof ResearchGraphAnnotation.State): AgentContext => ({ 
  analysisId: 'graph-run',
  rawQuery: state.rawQuery || '',
  resolvedTicker: state.resolvedTicker,
  timestamp: new Date().toISOString()
});

export async function tickerResolverNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await tickerResolverAgent.run(getContext(state), { rawCompanyName: state.rawQuery });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { resolvedTicker: res.data?.ticker, companyName: res.data?.companyName };
  } catch (err: any) {
    return { errors: [`TickerResolver failed: ${err.message}`] };
  }
}

export async function managerNode(state: typeof ResearchGraphAnnotation.State) {
  return {};
}

export async function financialNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await financialAgent.run(getContext(state), { ticker: state.resolvedTicker! });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { financialMetrics: res.data };
  } catch (err: any) {
    return { errors: [`FinancialAgent failed: ${err.message}`] };
  }
}

export async function companyResearchNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await companyResearchAgent.run(getContext(state), { ticker: state.resolvedTicker! });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { companyResearch: res.data };
  } catch (err: any) {
    return { errors: [`CompanyResearchAgent failed: ${err.message}`] };
  }
}

export async function riskNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await riskAgent.run(getContext(state), { ticker: state.resolvedTicker! });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { riskAssessment: res.data };
  } catch (err: any) {
    return { errors: [`RiskAgent failed: ${err.message}`] };
  }
}

export async function dataJoinNode(state: typeof ResearchGraphAnnotation.State) {
  return {};
}

export async function scoringNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await scoringAgent.run(getContext(state), { 
      financials: state.financialMetrics!,
      research: state.companyResearch!,
      risks: state.riskAssessment!
    });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { scoringResult: res.data };
  } catch (err: any) {
    return { errors: [`ScoringAgent failed: ${err.message}`] };
  }
}

export async function evidenceCollectorNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await evidenceCollectorAgent.run(getContext(state), {
      ticker: state.resolvedTicker!,
      companyName: state.companyName,
      financials: state.financialMetrics!,
      research: state.companyResearch!,
      risks: state.riskAssessment!,
      scoring: state.scoringResult!
    });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { evidencePackage: res.data };
  } catch (err: any) {
    return { errors: [`EvidenceCollector failed: ${err.message}`] };
  }
}

export async function bullNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await bullAgent.run(getContext(state), state.evidencePackage!);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { bullThesis: res.data };
  } catch (err: any) {
    return { errors: [`BullAgent failed: ${err.message}`] };
  }
}

export async function bearNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await bearAgent.run(getContext(state), state.evidencePackage!);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { bearThesis: res.data };
  } catch (err: any) {
    return { errors: [`BearAgent failed: ${err.message}`] };
  }
}

export async function judgeNode(state: typeof ResearchGraphAnnotation.State) {
  try {
    const res = await judgeAgent.run(getContext(state), {
      evidence: state.evidencePackage!,
      bullThesis: state.bullThesis!,
      bearThesis: state.bearThesis!
    });
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { judgeVerdict: res.data };
  } catch (err: any) {
    return { errors: [`JudgeAgent failed: ${err.message}`] };
  }
}

export async function reportGeneratorNode(state: typeof ResearchGraphAnnotation.State) {
  const markdown = `# Investment Analysis: ${state.companyName || state.resolvedTicker}
Verdict: ${state.judgeVerdict?.recommendation}
Confidence: ${state.judgeVerdict?.confidenceScore}
Winning Side: ${state.judgeVerdict?.winningSide}

## Rationale
${state.judgeVerdict?.finalReasoning}
`;
  return { finalReportMarkdown: markdown };
}

export async function reviewStateNode(state: typeof ResearchGraphAnnotation.State) {
  return { humanReviewStatus: 'Pending' as const };
}
