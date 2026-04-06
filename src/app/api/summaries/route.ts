import { NextResponse } from 'next/server';
import { getAllSummaries } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/summaries - Get all summaries
export async function GET() {
  try {
    const summaries = await getAllSummaries();
    return NextResponse.json({ summaries });
  } catch (error: any) {
    console.error('Summaries fetch error:', error);
    if (error.message?.includes('NEO4J_URI') || error.message?.includes('NEO4J_PASSWORD')) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Neo4j and add environment variables in Vercel.', setupUrl: '/setup' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    );
  }
}
