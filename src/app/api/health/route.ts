import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { env } from '@/lib/env';

export async function GET() {
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const status = {
    status: dbHealthy ? 'healthy' : 'degraded',
    database: dbHealthy,
    gemini: !!env.GEMINI_API_KEY,
    fmp: !!env.FMP_API_KEY,
    finnhub: !!env.FINNHUB_API_KEY,
    tavily: !!env.TAVILY_API_KEY,
  };

  return NextResponse.json(status, { status: dbHealthy ? 200 : 503 });
}
