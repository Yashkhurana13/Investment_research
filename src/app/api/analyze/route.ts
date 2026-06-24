import { NextResponse } from 'next/server';
import { startAnalysis } from '@/lib/api/analysis-service';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Will throw ZodError if validation fails inside service
    const result = await startAnalysis(body);
    
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
