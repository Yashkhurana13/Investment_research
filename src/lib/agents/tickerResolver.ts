import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { resolveTicker } from '../services/providers/finnhub';

export interface TickerResolverInput {
  rawCompanyName: string;
}

export interface TickerResolverOutput {
  ticker: string;
  companyName: string;
  exchange: string;
  confidenceScore: number;
}

export class TickerResolverAgent extends BaseAgent<TickerResolverInput, TickerResolverOutput> {
  readonly metadata: AgentMetadata = {
    name: 'TickerResolver',
    description: 'Resolves raw company names to exact stock tickers using Finnhub search API.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: TickerResolverInput): boolean {
    if (!input.rawCompanyName || input.rawCompanyName.trim().length === 0) {
      return false;
    }
    return true;
  }

  protected async execute(context: AgentContext, input: TickerResolverInput): Promise<TickerResolverOutput> {
    const query = input.rawCompanyName.trim();
    const result = await resolveTicker(query);

    if (!result.success) {
      throw new Error(`Finnhub API error: ${result.error.message}`);
    }

    const searchResults = result.data.result || [];
    
    if (searchResults.length === 0) {
      throw new Error(`No matches found for company: ${query}`);
    }

    const bestMatch = searchResults[0];
    const isExact = bestMatch.description.toLowerCase() === query.toLowerCase();
    
    if (!bestMatch.symbol || !/^[A-Z0-9.\-]+$/.test(bestMatch.symbol)) {
      throw new Error(`Invalid symbol resolved: ${bestMatch.symbol}`);
    }

    return {
      ticker: bestMatch.symbol,
      companyName: bestMatch.description,
      exchange: bestMatch.type,
      confidenceScore: isExact ? 1.0 : (searchResults.length === 1 ? 0.9 : 0.7),
    };
  }
}
