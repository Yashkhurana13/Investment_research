import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { EvidencePackage } from '../graph/state';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../env';
import { BearThesisSchema, BearThesisAnalysis } from '../types/debate';

export class BearAgent extends BaseAgent<EvidencePackage, BearThesisAnalysis> {
  readonly metadata: AgentMetadata = {
    name: 'BearAgent',
    description: 'Constructs the strongest possible anti-investment case.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: EvidencePackage): boolean {
    return !!input.company && !!input.financials;
  }

  protected async execute(context: AgentContext, input: EvidencePackage): Promise<BearThesisAnalysis> {
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: env.GEMINI_API_KEY,
      temperature: 0.3,
    }).withStructuredOutput(BearThesisSchema);

    const prompt = `You are the Bear Agent. Your job is to construct the strongest possible anti-investment (bear) case for ${input.company.ticker}.
Highlight risks, financial weaknesses, regulatory concerns, and competitive threats.
DO NOT invent facts. You MUST cite evidence directly from the provided Evidence Package.

Evidence Package:
${JSON.stringify(input, null, 2)}
`;

    return await llm.invoke(prompt);
  }
}
