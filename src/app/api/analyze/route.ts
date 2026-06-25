import { NextResponse } from 'next/server';
import { startAnalysis } from '@/lib/api/analysis-service';
import { z } from 'zod';

const analyzeSchema = z.object({
  query: z.string().min(1, "Query is required").max(100, "Query is too long")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analyzeSchema.parse(body);
    
    const result = await startAnalysis(parsed.query);
    
    return NextResponse.json(result, { status: 202 }); // 202 Accepted
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('API Error in POST /api/analyze:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
