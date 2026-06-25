import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { env, validateEnv } from '@/lib/env';

export async function GET() {
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const envCheck = validateEnv();

  const status = {
    status: (dbHealthy && envCheck.isValid) ? 'healthy' : 'degraded',
    database: dbHealthy,
    gemini: !!env.GEMINI_API_KEY,
    fmp: !!env.FMP_API_KEY,
    finnhub: !!env.FINNHUB_API_KEY,
    tavily: !!env.TAVILY_API_KEY,
    version: '0.1.0',
    uptime: process.uptime() + 's',
    timestamp: new Date().toISOString(),
    envErrors: envCheck.errors || null
  };

  return NextResponse.json(status, { status: (dbHealthy && envCheck.isValid) ? 200 : 503 });
}
