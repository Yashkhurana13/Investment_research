import { NextResponse } from 'next/server';
import { getAnalysisReport } from '@/lib/api/report-service';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    const report = await getAnalysisReport(analysisId);
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error(`API Error in GET /api/reports/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
