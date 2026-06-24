import { prisma } from './prisma';
import { AnalysisStatus, ScoreCategory } from '../types';
import { Prisma } from '@prisma/client';

export async function createAnalysis(userId: string, rawQuery: string) {
  return prisma.analysis.create({
    data: {
      userId,
      rawQuery,
      status: AnalysisStatus.PENDING,
    },
  });
}

export async function updateAnalysisStatus(analysisId: string, status: AnalysisStatus) {
  return prisma.analysis.update({
    where: { id: analysisId },
    data: { status },
  });
}

export async function saveAgentOutput(
  analysisId: string,
  agentName: string,
  outputData: Prisma.InputJsonValue,
  startedAt: Date,
  completedAt: Date,
  executionTimeMs: number
) {
  return prisma.agentOutput.create({
    data: {
      analysisId,
      agentName,
      outputData,
      startedAt,
      completedAt,
      executionTimeMs,
    },
  });
}

export async function createReport(
  analysisId: string,
  contentMarkdown: string,
  scoreCategory: ScoreCategory,
  totalScore: number,
  confidenceScore: number
) {
  return prisma.report.create({
    data: {
      analysisId,
      contentMarkdown,
      scoreCategory,
      totalScore,
      confidenceScore,
    },
  });
}
