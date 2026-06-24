import { z } from 'zod';
import { fetchWithRetry } from '../core/http-client';
import { DataValidationError } from '../core/errors';
import { defaultCache } from '../../core/cache';
import { env } from '../../env';
import { SourceMetadata } from '../../graph/state';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export type Result<T> =
  | { success: true; data: T; metadata: SourceMetadata }
  | { success: false; error: Error };

const FinnhubSearchSchema = z.object({
  count: z.number(),
  result: z.array(z.object({
    description: z.string(),
    displaySymbol: z.string(),
    symbol: z.string(),
    type: z.string()
  }))
});

export async function resolveTicker(query: string): Promise<Result<any>> {
  const cacheKey = `finnhub:search:${query}`;
  const cached = await defaultCache.get<any>(cacheKey);

  if (cached) {
    return {
      success: true,
      data: cached,
      metadata: { source: 'Finnhub (Cache)', url: FINNHUB_BASE_URL, retrievedAt: new Date().toISOString(), confidenceWeight: 0.8 },
    };
  }

  try {
    const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${env.FINNHUB_API_KEY}`;
    const rawData = await fetchWithRetry(url);

    const parsed = FinnhubSearchSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new DataValidationError('Invalid search payload from Finnhub');
    }

    await defaultCache.set(cacheKey, parsed.data, 86400 * 7);

    return {
      success: true,
      data: parsed.data,
      metadata: { source: 'Finnhub', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.8 },
    };
  } catch (error: any) {
    return { success: false, error };
  }
}
