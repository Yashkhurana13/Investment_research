import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { EvidencePackage } from '../graph/state';
import { BullThesisAnalysis, BearThesisAnalysis, JudgeVerdictSchema, JudgeVerdictAnalysis } from '../types/debate';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../env';

export interface JudgeInput {
  evidence: EvidencePackage;
  bullThesis: BullThesisAnalysis;
  bearThesis: BearThesisAnalysis;
}

export class JudgeAgent extends BaseAgent<JudgeInput, JudgeVerdictAnalysis> {
  readonly metadata: AgentMetadata = {
    name: 'JudgeAgent',
    description: 'Weighs the bull and bear cases and issues a final verdict.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: JudgeInput): boolean {
    return !!input.evidence && !!input.bullThesis && !!input.bearThesis;
  }

  protected async execute(context: AgentContext, input: JudgeInput): Promise<JudgeVerdictAnalysis> {
    const deterministicCategory = input.evidence.scoring.recommendation; // INVEST, WATCHLIST, or PASS
    const confidenceScoreTrigger = input.evidence.confidenceScore < 60;
    const hasCriticalRisk = input.evidence.weaknesses.some(w => w.includes('CRITICAL Risk'));

    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: env.GEMINI_API_KEY,
      temperature: 0.1,
    }).withStructuredOutput(JudgeVerdictSchema);

    const prompt = `You are the final Judge Agent for the investment analysis of ${input.evidence.company.ticker}.
Your job is to weigh the Bull Thesis against the Bear Thesis based on the Evidence Package.

RULES:
1. You MUST respect the deterministic scoring category: ${deterministicCategory}. You CANNOT upgrade the recommendation beyond this.
2. If the confidenceScore from the evidence package is < 60, OR if there is critical missing data, OR if there is massive contradictory evidence, you MUST downgrade the recommendation to "NEEDS_REVIEW".
3. Evaluate which side made the stronger, more evidence-backed case.

Context Triggers:
- Evidence Confidence Score: ${input.evidence.confidenceScore} (Requires NEEDS_REVIEW if < 60)
- Has Critical Risks: ${hasCriticalRisk}

Bull Thesis:
${JSON.stringify(input.bullThesis, null, 2)}

Bear Thesis:
${JSON.stringify(input.bearThesis, null, 2)}

Make your final verdict.
`;

    return await llm.invoke(prompt);
  }
}
