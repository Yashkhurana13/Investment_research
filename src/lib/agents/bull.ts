import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { EvidencePackage } from '../graph/state';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../env';
import { BullThesisSchema, BullThesisAnalysis } from '../types/debate';

export class BullAgent extends BaseAgent<EvidencePackage, BullThesisAnalysis> {
  readonly metadata: AgentMetadata = {
    name: 'BullAgent',
    description: 'Constructs the strongest possible investment case.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: EvidencePackage): boolean {
    return !!input.company && !!input.financials;
  }

  protected async execute(context: AgentContext, input: EvidencePackage): Promise<BullThesisAnalysis> {
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: env.GEMINI_API_KEY,
      temperature: 0.3,
    }).withStructuredOutput(BullThesisSchema);

    const prompt = `You are the Bull Agent. Your job is to construct the strongest possible investment case for ${input.company.ticker}.
Ignore weak negative signals and focus on growth opportunities, catalysts, and positive financial metrics.
DO NOT invent facts. You MUST cite evidence directly from the provided Evidence Package.

Evidence Package:
${JSON.stringify(input, null, 2)}
`;

    return await llm.invoke(prompt);
  }
}
