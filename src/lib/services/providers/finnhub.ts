import { z } from 'zod';
import { fetchWithRetry } from '../core/http-client';
import { DataValidationError } from '../core/errors';
import { cacheGet, cacheSet } from '../redis';
import { env } from '../../env';
import { SourceMetadata } from '../../graph/state';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export type Result<T> =
  | { success: true; data: T; metadata: SourceMetadata }
  | { success: false; error: Error };

const BaseFinnhubSchema = z.any();

export async function resolveTicker(query: string): Promise<Result<any>> {
  const cacheKey = `finnhub:search:${query}`;
  const cached = await cacheGet<any>(cacheKey);

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

    const parsed = BaseFinnhubSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new DataValidationError('Invalid search payload from Finnhub');
    }

    await cacheSet(cacheKey, parsed.data, 86400 * 7);

    return {
      success: true,
      data: parsed.data,
      metadata: { source: 'Finnhub', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.8 },
    };
  } catch (error: any) {
    return { success: false, error };
  }
}
