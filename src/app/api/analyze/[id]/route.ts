import { NextResponse } from 'next/server';
import { getAnalysisProgress } from '@/lib/api/progress-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysisId = id;
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    const progress = await getAnalysisProgress(analysisId);
    
    if (!progress) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error(`API Error in GET /api/analyze:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
