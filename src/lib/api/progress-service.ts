import { prisma } from '../database/prisma';

export async function getAnalysisProgress(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: { agentOutputs: true }
  });

  if (!analysis) return null;

  const outputs = analysis.agentOutputs;
  
  const completedNodes = outputs.filter(o => {
    const data = o.outputData as any;
    return data?.status === 'SUCCESS';
  }).map(o => o.agentName);
  
  const failedNodes = outputs.filter(o => {
    const data = o.outputData as any;
    return data?.status === 'FAILED';
  }).map(o => o.agentName);
  
  let currentNode = 'none';
  if (analysis.status === 'IN_PROGRESS' || analysis.status === 'PENDING') {
    const lastOutput = [...outputs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    currentNode = lastOutput ? lastOutput.agentName : 'tickerResolver';
  } else {
    currentNode = 'COMPLETED';
  }

  let progress = 0;
  if (completedNodes.includes('tickerResolver')) progress = 10;
  if (completedNodes.includes('financial') && completedNodes.includes('companyResearch') && completedNodes.includes('risk')) progress = 40;
  if (completedNodes.includes('scoring')) progress = 50;
  if (completedNodes.includes('evidenceCollector')) progress = 60;
  if (completedNodes.includes('bull') && completedNodes.includes('bear')) progress = 80;
  if (completedNodes.includes('judge')) progress = 90;
  if (completedNodes.includes('reportGenerator')) progress = 100;

  const fallbackUsed = outputs.some(o => (o.outputData as any)?.fallbackUsed === true);
  const retryCount = outputs.reduce((acc, o) => acc + ((o.outputData as any)?.retryCount || 0), 0);

  return {
    analysisId: analysis.id,
    status: analysis.status,
    currentNode,
    progress,
    completedNodes,
    failedNodes,
    retryCount,
    fallbackUsed,
    startedAt: analysis.createdAt,
    updatedAt: analysis.updatedAt
  };
}
