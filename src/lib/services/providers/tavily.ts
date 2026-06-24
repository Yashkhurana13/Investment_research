import { z } from 'zod';
import { fetchWithRetry } from '../core/http-client';
import { DataValidationError } from '../core/errors';
import { defaultCache } from '../../core/cache';
import { env } from '../../env';
import { SourceMetadata } from '../../graph/state';

const TAVILY_BASE_URL = 'https://api.tavily.com';

export type Result<T> =
  | { success: true; data: T; metadata: SourceMetadata }
  | { success: false; error: Error };

const TavilySearchSchema = z.any();

export async function searchWeb(query: string): Promise<Result<any>> {
  const cacheKey = `tavily:search:${query}`;
  const cached = await defaultCache.get<any>(cacheKey);

  if (cached) {
    return {
      success: true,
      data: cached,
      metadata: { source: 'Tavily (Cache)', url: TAVILY_BASE_URL, retrievedAt: new Date().toISOString(), confidenceWeight: 0.7 },
    };
  }

  try {
    const url = `${TAVILY_BASE_URL}/search`;
    const rawData = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        include_answer: true,
      }),
    });

    const parsed = TavilySearchSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new DataValidationError('Invalid search payload from Tavily');
    }

    await defaultCache.set(cacheKey, parsed.data, 86400); // 1 hour cache for news/search

    return {
      success: true,
      data: parsed.data,
      metadata: { source: 'Tavily Web Search', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.7 },
    };
  } catch (error: any) {
    return { success: false, error };
  }
}
