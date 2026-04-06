import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required. Add your Neon PostgreSQL connection string to Vercel environment variables.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

// Database schema initialization - call this once on startup
const SCHEMA_QUERIES = [
  `CREATE TABLE IF NOT EXISTS tracked_pages (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS snapshots (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES tracked_pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES tracked_pages(id) ON DELETE CASCADE,
    previous_snapshot_id INTEGER REFERENCES snapshots(id),
    current_snapshot_id INTEGER REFERENCES snapshots(id),
    summary TEXT,
    diff_type TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
];

export async function initDB(): Promise<void> {
  const client = await getPool().connect();
  try {
    for (const query of SCHEMA_QUERIES) {
      await client.query(query);
    }
  } finally {
    client.release();
  }
}

// Tracked Pages
export async function getTrackedPages(): Promise<Record<string, any>[]> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query('SELECT * FROM tracked_pages ORDER BY created_at DESC');
    return rows;
  } finally {
    client.release();
  }
}

export async function addTrackedPage(url: string, name?: string): Promise<Record<string, any> | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO tracked_pages (url, name) VALUES ($1, $2)
       ON CONFLICT (url) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [url, name || url]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Snapshots
export async function getLatestSnapshot(pageId: number): Promise<Record<string, any> | null> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM snapshots WHERE page_id = $1 ORDER BY created_at DESC LIMIT 1',
      [pageId]
    );
    if (result.rows.length === 0) return null;
    return { ...result.rows[0], content: result.rows[0].content };
  } finally {
    client.release();
  }
}

export async function saveSnapshot(pageId: number, content: any): Promise<Record<string, any>> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'INSERT INTO snapshots (page_id, content) VALUES ($1, $2) RETURNING *',
      [pageId, JSON.stringify(content)]
    );
    return { ...result.rows[0], content };
  } finally {
    client.release();
  }
}

export async function getSnapshots(pageId: number): Promise<Record<string, any>[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM snapshots WHERE page_id = $1 ORDER BY created_at DESC',
      [pageId]
    );
    return result.rows.map(r => ({ ...r, content: r.content }));
  } finally {
    client.release();
  }
}

// Summaries
export async function saveSummary(
  pageId: number,
  previousSnapshotId: number,
  currentSnapshotId: number,
  summary: string,
  diffType: string
): Promise<Record<string, any>> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO summaries (page_id, previous_snapshot_id, current_snapshot_id, summary, diff_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pageId, previousSnapshotId, currentSnapshotId, summary, diffType]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getSummaries(pageId: number): Promise<Record<string, any>[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM summaries WHERE page_id = $1 ORDER BY created_at DESC',
      [pageId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getAllSummaries(): Promise<Record<string, any>[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT s.*, tp.url, tp.name
       FROM summaries s
       JOIN tracked_pages tp ON s.page_id = tp.id
       ORDER BY s.created_at DESC`
    );
    return result.rows;
  } finally {
    client.release();
  }
}