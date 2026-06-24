import { createAnalysis, updateAnalysisStatus, createReport } from '../database/db';
import { AnalysisStatus } from '../types';
import { researchGraph } from '../graph';
import { getAnalysisProgress } from './progress-service';

export async function startAnalysis(query: string, userId: string = 'system') {
  const analysis = await createAnalysis(userId, query);

  (async () => {
    try {
      await updateAnalysisStatus(analysis.id, AnalysisStatus.IN_PROGRESS);
      
      const finalState = await researchGraph.invoke(
        { rawQuery: query }, 
        { configurable: { thread_id: analysis.id } }
      );

      if (finalState.errors?.length > 0 && finalState.humanReviewStatus !== 'Pending') {
        const criticalFailure = finalState.errors.some((e: string) => e.includes('TickerResolver') || e.includes('FinancialAgent'));
        if (criticalFailure) {
           await updateAnalysisStatus(analysis.id, AnalysisStatus.FAILED);
           return;
        }
      } 
      
      if (finalState.humanReviewStatus === 'Pending') {
        await updateAnalysisStatus(analysis.id, AnalysisStatus.NEEDS_REVIEW);
      } else {
        await updateAnalysisStatus(analysis.id, AnalysisStatus.COMPLETED);
      }

      if (finalState.finalReportMarkdown && finalState.judgeVerdict) {
        await createReport(
          analysis.id,
          finalState.finalReportMarkdown,
          (finalState.judgeVerdict.recommendation === 'NEEDS_REVIEW' ? 'WATCHLIST' : finalState.judgeVerdict.recommendation) as any,
          finalState.scoringResult?.totalScore || 0,
          finalState.judgeVerdict.confidenceScore
        );
      }
    } catch (error) {
      console.error(`Analysis ${analysis.id} failed:`, error);
      await updateAnalysisStatus(analysis.id, AnalysisStatus.FAILED);
    }
  })();

  return {
    analysisId: analysis.id,
    status: AnalysisStatus.PENDING,
    estimatedSteps: 11,
    graphVersion: "1.0.0"
  };
}
