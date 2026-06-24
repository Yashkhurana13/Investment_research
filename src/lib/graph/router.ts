import { ResearchGraphAnnotation } from './state';
import { END } from '@langchain/langgraph';

export function routeAfterTickerResolver(state: typeof ResearchGraphAnnotation.State) {
  const isCriticalFailure = state.errors.some(e => e.includes('TickerResolver failed'));
  if (isCriticalFailure || !state.resolvedTicker) {
    return END;
  }
  return 'manager';
}

export function routeAfterDataCollection(state: typeof ResearchGraphAnnotation.State) {
  const isCriticalFailure = state.errors.some(e => e.includes('FinancialAgent failed'));
  if (isCriticalFailure) {
    return END;
  }
  return 'scoring';
}

export function routeAfterJudge(state: typeof ResearchGraphAnnotation.State) {
  if (state.judgeVerdict?.recommendation === 'NEEDS_REVIEW') {
    return 'reviewState';
  }
  return 'reportGenerator';
}
