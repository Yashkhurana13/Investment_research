import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { CompanyResearchOutput, FactRecord } from '../graph/state';
import { searchWeb } from '../services/providers/tavily';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../env';
import { CompanyResearchSchema } from '../types/companyResearch';

export interface CompanyResearchInput {
  ticker: string;
}

export class CompanyResearchAgent extends BaseAgent<CompanyResearchInput, CompanyResearchOutput> {
  readonly metadata: AgentMetadata = {
    name: 'CompanyResearch',
    description: 'Researches company news, sentiment, and catalysts using Tavily and Gemini.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: CompanyResearchInput): boolean {
    return !!input.ticker && input.ticker.trim().length > 0;
  }

  protected async execute(context: AgentContext, input: CompanyResearchInput): Promise<CompanyResearchOutput> {
    const ticker = input.ticker.trim();

    // 1. Gather data from Tavily
    const searchResult = await searchWeb(`${ticker} company news, growth catalysts, and market sentiment`);
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
    }).withStructuredOutput(CompanyResearchSchema);

    const prompt = `Analyze the following recent news and data for ${ticker}. 
Extract the sentiment score (0-100), a short news summary, and a list of growth catalysts.
Data:
${contextText}`;

    const analysis = await llm.invoke(prompt);

    // 3. Format into FactRecords with attribution
    const createFact = <T>(value: T): FactRecord<T> => ({
      value,
      metadata: {
        source: 'Tavily + Gemini 2.5 Flash',
        url: primarySourceUrl,
        retrievedAt: new Date().toISOString(),
        confidenceWeight: 0.85,
      }
    });

    return {
      sentimentScore: createFact(analysis.sentimentScore),
      newsSummary: createFact(analysis.newsSummary),
      catalysts: analysis.catalysts.map((c: string) => createFact(c)),
    };
  }
}
