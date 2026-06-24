import { prisma } from '../database/prisma';

export async function getAnalysisReport(analysisId: string) {
  const report = await prisma.report.findFirst({
    where: { analysisId }
  });

  if (!report) return null;

  const judgeOutput = await prisma.agentOutput.findFirst({
    where: { analysisId, agentName: 'judge' }
  });
  
  return {
    analysisId,
    recommendation: report.scoreCategory,
    totalScore: report.totalScore,
    confidenceScore: report.confidenceScore,
    reportMarkdown: report.contentMarkdown,
    verdict: judgeOutput ? (judgeOutput.outputData as any)?.data : {}
  };
}
