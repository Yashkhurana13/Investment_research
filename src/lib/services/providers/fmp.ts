import { z } from 'zod';
import { fetchWithRetry } from '../core/http-client';
import { DataValidationError } from '../core/errors';
import { defaultCache } from '../../core/cache';
import { env } from '../../env';
import { SourceMetadata } from '../../graph/state';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

export type Result<T> =
  | { success: true; data: T; metadata: SourceMetadata }
  | { success: false; error: Error };

// Note: These schemas will be fully populated in the next step.
// This is the architectural skeleton.
const BaseFmpSchema = z.any(); 

export async function fetchCompanyProfile(ticker: string): Promise<Result<any>> {
  const cacheKey = `fmp:profile:${ticker}`;
  const cached = await defaultCache.get<any>(cacheKey);

  if (cached) {
    return {
      success: true,
      data: cached,
      metadata: { source: 'FMP (Cache)', url: FMP_BASE_URL, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 },
    };
  }

  try {
    const url = `${FMP_BASE_URL}/profile/${ticker}?apikey=${env.FMP_API_KEY}`;
    const rawData = await fetchWithRetry(url);

    const parsed = BaseFmpSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new DataValidationError('Invalid payload from FMP');
    }

    await defaultCache.set(cacheKey, parsed.data, 86400 * 7); // 7 day cache

    return {
      success: true,
      data: parsed.data,
      metadata: { source: 'Financial Modeling Prep', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 },
    };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function fetchKeyMetrics(ticker: string): Promise<Result<any>> {
  try {
    const url = `${FMP_BASE_URL}/key-metrics/${ticker}?apikey=${env.FMP_API_KEY}`;
    const rawData = await fetchWithRetry(url);
    return { success: true, data: rawData, metadata: { source: 'Financial Modeling Prep', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 } };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function fetchIncomeStatement(ticker: string): Promise<Result<any>> {
  try {
    const url = `${FMP_BASE_URL}/income-statement/${ticker}?apikey=${env.FMP_API_KEY}`;
    const rawData = await fetchWithRetry(url);
    return { success: true, data: rawData, metadata: { source: 'Financial Modeling Prep', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 } };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function fetchBalanceSheet(ticker: string): Promise<Result<any>> {
  try {
    const url = `${FMP_BASE_URL}/balance-sheet-statement/${ticker}?apikey=${env.FMP_API_KEY}`;
    const rawData = await fetchWithRetry(url);
    return { success: true, data: rawData, metadata: { source: 'Financial Modeling Prep', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 } };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function fetchCashFlowStatement(ticker: string): Promise<Result<any>> {
  try {
    const url = `${FMP_BASE_URL}/cash-flow-statement/${ticker}?apikey=${env.FMP_API_KEY}`;
    const rawData = await fetchWithRetry(url);
    return { success: true, data: rawData, metadata: { source: 'Financial Modeling Prep', url, retrievedAt: new Date().toISOString(), confidenceWeight: 0.9 } };
  } catch (error: any) {
    return { success: false, error };
  }
}
