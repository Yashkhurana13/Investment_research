import { BaseAgent } from './base';
import { AgentContext, AgentMetadata } from './types';
import { FinancialMetricsOutput, FactRecord } from '../graph/state';
import {
  fetchCompanyProfile,
  fetchKeyMetrics,
  fetchIncomeStatement,
  fetchBalanceSheet,
  fetchCashFlowStatement
} from '../services/providers/fmp';

export interface FinancialAgentInput {
  ticker: string;
}

export class FinancialAgent extends BaseAgent<FinancialAgentInput, FinancialMetricsOutput> {
  readonly metadata: AgentMetadata = {
    name: 'FinancialAgent',
    description: 'Collects quantitative financial metrics and statements from FMP.',
    version: '1.0.0',
  };

  protected validateInput(context: AgentContext, input: FinancialAgentInput): boolean {
    if (!input.ticker || input.ticker.trim().length === 0) {
      return false;
    }
    return true;
  }

  protected async execute(context: AgentContext, input: FinancialAgentInput): Promise<FinancialMetricsOutput> {
    const ticker = input.ticker.trim().toUpperCase();

    // Fire all requests concurrently for speed
    const [profileRes, metricsRes, incomeRes, balanceRes, cashFlowRes] = await Promise.all([
      fetchCompanyProfile(ticker),
      fetchKeyMetrics(ticker),
      fetchIncomeStatement(ticker),
      fetchBalanceSheet(ticker),
      fetchCashFlowStatement(ticker)
    ]);

    // Check for critical failures
    if (!profileRes.success) throw new Error(`Failed to fetch profile: ${profileRes.error.message}`);
    if (!metricsRes.success) throw new Error(`Failed to fetch key metrics: ${metricsRes.error.message}`);
    if (!incomeRes.success) throw new Error(`Failed to fetch income statement: ${incomeRes.error.message}`);
    if (!balanceRes.success) throw new Error(`Failed to fetch balance sheet: ${balanceRes.error.message}`);
    if (!cashFlowRes.success) throw new Error(`Failed to fetch cash flow statement: ${cashFlowRes.error.message}`);

    const profileData = profileRes.data[0] || {};
    const metricsData = metricsRes.data[0] || {};
    const incomeData = incomeRes.data[0] || {};
    const balanceData = balanceRes.data[0] || {};
    const cashFlowData = cashFlowRes.data[0] || {};

    const createFact = (value: number, metadata: any): FactRecord<number> => ({
      value: value || 0,
      metadata
    });

    return {
      peRatio: createFact(metricsData.peRatio, metricsRes.metadata),
      revenueGrowthYOY: createFact(incomeData.revenueGrowth || 0, incomeRes.metadata), 
      debtToEquity: createFact(metricsData.debtToEquity, metricsRes.metadata),
      grossMargin: createFact(incomeData.grossMarginRatio, incomeRes.metadata),
      freeCashFlow: createFact(cashFlowData.freeCashFlow, cashFlowRes.metadata),
    };
  }
}
