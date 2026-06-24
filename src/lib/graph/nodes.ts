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
import { AgentContext, AgentResult } from '../agents/types';
import { saveAgentOutput } from '../database/db';

const tickerResolverAgent = new TickerResolverAgent();
const financialAgent = new FinancialAgent();
const companyResearchAgent = new CompanyResearchAgent();
const riskAgent = new RiskAgent();
const scoringAgent = new ScoringAgent();
const evidenceCollectorAgent = new EvidenceCollectorAgent();
const bullAgent = new BullAgent();
const bearAgent = new BearAgent();
const judgeAgent = new JudgeAgent();

const getContext = (state: typeof ResearchGraphAnnotation.State, analysisId?: string): AgentContext => ({ 
  analysisId: analysisId || 'graph-run',
  rawQuery: state.rawQuery || '',
  resolvedTicker: state.resolvedTicker,
  timestamp: new Date().toISOString()
});

async function persistOutput(config: any, agentName: string, res: AgentResult<any>) {
  const analysisId = config?.configurable?.thread_id;
  if (!analysisId) return;

  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - res.executionTimeMs);

  await saveAgentOutput(
    analysisId,
    agentName,
    {
      status: res.status,
      errors: res.errors,
      retryCount: res.retryCount,
      fallbackUsed: res.fallbackUsed,
      failureReason: res.failureReason,
      data: res.data // Needed for JudgeVerdict in report-service
    },
    startedAt,
    completedAt,
    res.executionTimeMs
  );
}

export async function tickerResolverNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await tickerResolverAgent.run(getContext(state, config?.configurable?.thread_id), { rawCompanyName: state.rawQuery });
    await persistOutput(config, 'tickerResolver', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { resolvedTicker: res.data?.ticker, companyName: res.data?.companyName };
  } catch (err: any) {
    return { errors: [`TickerResolver failed: ${err.message}`] };
  }
}

export async function managerNode(state: typeof ResearchGraphAnnotation.State) {
  return {};
}

export async function financialNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await financialAgent.run(getContext(state, config?.configurable?.thread_id), { ticker: state.resolvedTicker! });
    await persistOutput(config, 'financial', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { financialMetrics: res.data };
  } catch (err: any) {
    return { errors: [`FinancialAgent failed: ${err.message}`] };
  }
}

export async function companyResearchNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await companyResearchAgent.run(getContext(state, config?.configurable?.thread_id), { ticker: state.resolvedTicker! });
    await persistOutput(config, 'companyResearch', res);
    if (res.status !== 'SUCCESS') {
      return { 
        errors: [`CompanyResearchAgent failed: ${res.failureReason}`],
      };
    }
    return { companyResearch: res.data };
  } catch (err: any) {
    return { errors: [`CompanyResearchAgent failed: ${err.message}`] };
  }
}

export async function riskNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await riskAgent.run(getContext(state, config?.configurable?.thread_id), { ticker: state.resolvedTicker! });
    await persistOutput(config, 'risk', res);
    if (res.status !== 'SUCCESS') {
      return { 
        errors: [`RiskAgent failed: ${res.failureReason}`],
      };
    }
    return { riskAssessment: res.data };
  } catch (err: any) {
    return { errors: [`RiskAgent failed: ${err.message}`] };
  }
}

export async function dataJoinNode(state: typeof ResearchGraphAnnotation.State) {
  return {};
}

export async function scoringNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await scoringAgent.run(getContext(state, config?.configurable?.thread_id), { 
      financials: state.financialMetrics!,
      research: state.companyResearch!,
      risks: state.riskAssessment!
    });
    await persistOutput(config, 'scoring', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { scoringResult: res.data };
  } catch (err: any) {
    return { errors: [`ScoringAgent failed: ${err.message}`] };
  }
}

export async function evidenceCollectorNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await evidenceCollectorAgent.run(getContext(state, config?.configurable?.thread_id), {
      ticker: state.resolvedTicker!,
      companyName: state.companyName,
      financials: state.financialMetrics!,
      research: state.companyResearch!,
      risks: state.riskAssessment!,
      scoring: state.scoringResult!
    });
    await persistOutput(config, 'evidenceCollector', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { evidencePackage: res.data };
  } catch (err: any) {
    return { errors: [`EvidenceCollector failed: ${err.message}`] };
  }
}

export async function bullNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await bullAgent.run(getContext(state, config?.configurable?.thread_id), state.evidencePackage!);
    await persistOutput(config, 'bull', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { bullThesis: res.data };
  } catch (err: any) {
    return { errors: [`BullAgent failed: ${err.message}`] };
  }
}

export async function bearNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await bearAgent.run(getContext(state, config?.configurable?.thread_id), state.evidencePackage!);
    await persistOutput(config, 'bear', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { bearThesis: res.data };
  } catch (err: any) {
    return { errors: [`BearAgent failed: ${err.message}`] };
  }
}

export async function judgeNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  try {
    const res = await judgeAgent.run(getContext(state, config?.configurable?.thread_id), {
      evidence: state.evidencePackage!,
      bullThesis: state.bullThesis!,
      bearThesis: state.bearThesis!
    });
    await persistOutput(config, 'judge', res);
    if (res.status !== 'SUCCESS') throw new Error(res.errors?.join(', '));
    return { judgeVerdict: res.data };
  } catch (err: any) {
    return { errors: [`JudgeAgent failed: ${err.message}`] };
  }
}

export async function reportGeneratorNode(state: typeof ResearchGraphAnnotation.State, config?: any) {
  const markdown = `# Investment Analysis: ${state.companyName || state.resolvedTicker}
Verdict: ${state.judgeVerdict?.recommendation}
Confidence: ${state.judgeVerdict?.confidenceScore}
Winning Side: ${state.judgeVerdict?.winningSide}

## Rationale
${state.judgeVerdict?.finalReasoning}
`;
  
  const analysisId = config?.configurable?.thread_id;
  if (analysisId) {
    await saveAgentOutput(
      analysisId,
      'reportGenerator',
      { status: 'SUCCESS' },
      new Date(),
      new Date(),
      10
    );
  }

  return { finalReportMarkdown: markdown };
}

export async function reviewStateNode(state: typeof ResearchGraphAnnotation.State) {
  return { humanReviewStatus: 'Pending' as const };
}
