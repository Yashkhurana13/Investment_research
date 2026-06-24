import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { RiskAssessmentOutput, FactRecord } from '../graph/state';
import { searchWeb } from '../services/providers/tavily';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../env';
import { RiskAssessmentSchema } from '../types/risk';

export interface RiskAgentInput {
  ticker: string;
}

export class RiskAgent extends BaseAgent<RiskAgentInput, RiskAssessmentOutput> {
  readonly metadata: AgentMetadata = {
    name: 'RiskAgent',
    description: 'Identifies regulatory, macro, and micro risks using Tavily and Gemini.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: RiskAgentInput): boolean {
    return !!input.ticker && input.ticker.trim().length > 0;
  }

  protected async execute(context: AgentContext, input: RiskAgentInput): Promise<RiskAssessmentOutput> {
    const ticker = input.ticker.trim();

    // 1. Gather data from Tavily
    const searchResult = await searchWeb(`${ticker} regulatory risks, macroeconomic headwinds, competitor threats, and company-specific risks`);
    if (!searchResult.success) {
      throw new Error(`Tavily search failed: ${searchResult.error.message}`);
    }

    const rawDocs = searchResult.data.results || [];
    const contextText = rawDocs.map((r: any) => `URL: ${r.url}\nContent: ${r.content}`).join('\n\n');
    const primarySourceUrl = rawDocs.length > 0 ? rawDocs[0].url : 'https://tavily.com';

    // 2. Analyze with Gemini
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: env.GEMINI_API_KEY,
      temperature: 0.1,
    }).withStructuredOutput(RiskAssessmentSchema);

    const prompt = `Analyze the following risk-related news and data for ${ticker}. 
Extract macro risks, micro risks, and regulatory concerns.
Data:
${contextText}`;

    const analysis = await llm.invoke(prompt);

    // 3. Format into RiskRecords with attribution
    const createRisk = (item: { description: string, severity: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' }): any => ({
      value: item.description,
      severity: item.severity,
      metadata: {
        source: 'Tavily + Gemini 2.5 Flash',
        url: primarySourceUrl,
        retrievedAt: new Date().toISOString(),
        confidenceWeight: 0.85,
      }
    });

    return {
      macroRisks: analysis.macroRisks.map(createRisk),
      microRisks: analysis.microRisks.map(createRisk),
      regulatoryConcerns: analysis.regulatoryConcerns.map(createRisk),
    };
  }
}
