import { sql } from '@vercel/postgres';

// Database schema initialization
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS tracked_pages (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS snapshots (
      id SERIAL PRIMARY KEY,
      page_id INTEGER REFERENCES tracked_pages(id) ON DELETE CASCADE,
      content JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS summaries (
      id SERIAL PRIMARY KEY,
      page_id INTEGER REFERENCES tracked_pages(id) ON DELETE CASCADE,
      previous_snapshot_id INTEGER REFERENCES snapshots(id),
      current_snapshot_id INTEGER REFERENCES snapshots(id),
      summary TEXT,
      diff_type TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

// Get all tracked pages
export async function getTrackedPages() {
  const result = await sql`
    SELECT * FROM tracked_pages ORDER BY created_at DESC
  `;
  return result.rows;
}

// Add a tracked page
export async function addTrackedPage(url: string, name?: string) {
  const result = await sql`
    INSERT INTO tracked_pages (url, name)
    VALUES (${url}, ${name || url})
    ON CONFLICT (url) DO NOTHING
    RETURNING *
  `;
  return result.rows[0] || null;
}

// Get latest snapshot for a page
export async function getLatestSnapshot(pageId: number) {
  const result = await sql`
    SELECT * FROM snapshots
    WHERE page_id = ${pageId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return result.rows[0] || null;
}

// Save a snapshot
export async function saveSnapshot(pageId: number, content: any) {
  const result = await sql`
    INSERT INTO snapshots (page_id, content)
    VALUES (${pageId}, ${JSON.stringify(content)})
    RETURNING *
  `;
  return result.rows[0];
}

// Get all snapshots for a page
export async function getSnapshots(pageId: number) {
  const result = await sql`
    SELECT * FROM snapshots
    WHERE page_id = ${pageId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

// Save a summary
export async function saveSummary(
  pageId: number,
  previousSnapshotId: number,
  currentSnapshotId: number,
  summary: string,
  diffType: string
) {
  const result = await sql`
    INSERT INTO summaries 
    (page_id, previous_snapshot_id, current_snapshot_id, summary, diff_type)
    VALUES (${pageId}, ${previousSnapshotId}, ${currentSnapshotId}, ${summary}, ${diffType})
    RETURNING *
  `;
  return result.rows[0];
}

// Get summaries for a page
export async function getSummaries(pageId: number) {
  const result = await sql`
    SELECT * FROM summaries
    WHERE page_id = ${pageId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

// Get all summaries with page info
export async function getAllSummaries() {
  const result = await sql`
    SELECT s.*, tp.url, tp.name
    FROM summaries s
    JOIN tracked_pages tp ON s.page_id = tp.id
    ORDER BY s.created_at DESC
  `;
  return result.rows;
}
