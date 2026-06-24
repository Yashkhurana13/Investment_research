import { NextResponse } from 'next/server';
import { getAnalysisProgress } from '@/lib/api/progress-service';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    const progress = await getAnalysisProgress(analysisId);
    
    if (!progress) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error(`API Error in GET /api/analyze/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
