import { NextResponse } from 'next/server';
import { getAllSummaries } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/summaries - Get all summaries
export async function GET() {
  try {
    const summaries = await getAllSummaries();
    return NextResponse.json({ summaries });
  } catch (error) {
    console.error('Summaries fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    );
  }
}