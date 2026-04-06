import { NextRequest, NextResponse } from 'next/server';
import { addTrackedPage, getLatestSnapshot, saveSnapshot, getTrackedPages } from '@/lib/db';
import { generateChangeSummary } from '@/lib/openai';
import { saveSummary } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/capture - Receive captured page data from extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, listings, name } = body;

    if (!url || !listings) {
      return NextResponse.json(
        { error: 'url and listings are required' },
        { status: 400 }
      );
    }

    // Add/update the tracked page
    let page = await addTrackedPage(url, name || url);
    if (!page) {
      // Page already exists, fetch it
      const pages = await getTrackedPages();
      page = pages.find((p: any) => p.url === url) || pages[0];
    }

    // Get the previous snapshot
    const previousSnapshot = await getLatestSnapshot(page.id);

    // Save the new snapshot
    const newSnapshot = await saveSnapshot(page.id, { listings, capturedAt: new Date().toISOString() });

    let summary = null;

    // If there's a previous snapshot, compare and generate summary
    if (previousSnapshot) {
      const previousListings = previousSnapshot.content.listings || [];
      const summaryText = await generateChangeSummary(previousListings, listings, url);

      // Determine diff type
      const prevIds = new Set(previousListings.map((l: any) => l.id || l.title).filter(Boolean));
      const currIds = new Set(listings.map((l: any) => l.id || l.title).filter(Boolean));
      const newCount = listings.filter((l: any) => !prevIds.has(l.id || l.title)).length;
      const removedCount = previousListings.filter((l: any) => !currIds.has(l.id || l.title)).length;

      let diffType = 'no_change';
      if (newCount > 0 && removedCount === 0) diffType = 'new_ads';
      else if (newCount === 0 && removedCount > 0) diffType = 'removed';
      else if (newCount > 0 || removedCount > 0) diffType = 'mixed';

      summary = await saveSummary(
        page.id,
        previousSnapshot.id,
        newSnapshot.id,
        summaryText,
        diffType
      );
    } else {
      summary = { text: 'First capture - baseline established for this page.' };
    }

    return NextResponse.json({
      success: true,
      pageId: page.id,
      snapshotId: newSnapshot.id,
      isNewPage: !previousSnapshot,
      summary: summary,
    });
  } catch (error: any) {
    console.error('Capture error:', error);
    if (error.message?.includes('NEO4J_URI') || error.message?.includes('NEO4J_PASSWORD')) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Neo4j and add NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables in Vercel.', setupUrl: '/setup' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process capture' },
      { status: 500 }
    );
  }
}

// GET /api/capture - List all tracked pages
export async function GET() {
  try {
    const pages = await getTrackedPages();
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tracked pages' },
      { status: 500 }
    );
  }
}