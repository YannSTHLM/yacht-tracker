import { NextRequest, NextResponse } from 'next/server';
import { getTrackedPages } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/cron/scan - Cron job to scan tracked pages on schedule
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const pages = await getTrackedPages();
    
    if (pages.length === 0) {
      return NextResponse.json({ message: 'No pages to scan' });
    }

    const results = pages.map((page: any) => ({
      id: page.id,
      url: page.url,
      name: page.name,
      status: 'ready_for_browser_extension',
      note: 'Use the browser extension to capture listings from these pages.',
    }));

    return NextResponse.json({
      message: `Cron scan checked ${results.length} pages`,
      pages: results,
    });
  } catch (error) {
    console.error('Cron scan error:', error);
    return NextResponse.json(
      { error: 'Failed to run cron scan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  return NextResponse.json({ message: 'Cron endpoint is active' });
}