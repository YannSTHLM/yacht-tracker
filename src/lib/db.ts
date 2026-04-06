import neo4j, { Driver, Session, Integer } from 'neo4j-driver';

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || '';
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

async function runQuery(query: string, params: Record<string, any> = {}) {
  const session: Session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}

function nodeToObj(node: any): Record<string, any> {
  const properties = node.properties;
  return {
    id: node.identity.toString(),
    ...properties,
  };
}

function parseNodeContent(node: any): Record<string, any> {
  const properties = { ...node.properties };
  if (properties.content && typeof properties.content === 'string') {
    try {
      properties.content = JSON.parse(properties.content);
    } catch (e) {
      // Keep as string if not valid JSON
    }
  }
  return {
    id: node.identity.toString(),
    ...properties,
  };
}

// Tracked Pages
export async function getTrackedPages(): Promise<Record<string, any>[]> {
  const result = await runQuery(`
    MATCH (p:TrackedPage)
    RETURN p
    ORDER BY p.createdAt DESC
  `);
  return result.records.map((r: any) => nodeToObj(r.get('p')));
}

export async function addTrackedPage(url: string, name?: string): Promise<Record<string, any> | null> {
  const result = await runQuery(`
    MERGE (p:TrackedPage {url: $url})
    ON CREATE SET p.name = $name, p.createdAt = datetime()
    ON MATCH SET p.updatedAt = datetime()
    RETURN p
  `, { url, name: name || url });
  if (result.records.length === 0) return null;
  return nodeToObj(result.records[0].get('p'));
}

// Snapshots
export async function getLatestSnapshot(pageId: string): Promise<Record<string, any> | null> {
  const result = await runQuery(`
    MATCH (p:TrackedPage) WHERE id(p) = toInteger($pageId)
    MATCH (p)-[:HAS_SNAPSHOT]->(s:Snapshot)
    RETURN s
    ORDER BY s.createdAt DESC
    LIMIT 1
  `, { pageId });
  if (result.records.length === 0) return null;
  return parseNodeContent(result.records[0].get('s'));
}

export async function saveSnapshot(pageId: string, content: any): Promise<Record<string, any>> {
  const contentJson = JSON.stringify(content);
  const result = await runQuery(`
    MATCH (p:TrackedPage) WHERE id(p) = toInteger($pageId)
    CREATE (s:Snapshot {content: $content, createdAt: datetime()})
    CREATE (p)-[:HAS_SNAPSHOT]->(s)
    RETURN s
  `, { pageId, content: contentJson });
  const node = result.records[0].get('s');
  return { id: node.identity.toString(), content, createdAt: node.properties.createdAt };
}

export async function getSnapshots(pageId: string): Promise<Record<string, any>[]> {
  const result = await runQuery(`
    MATCH (p:TrackedPage) WHERE id(p) = toInteger($pageId)
    MATCH (p)-[:HAS_SNAPSHOT]->(s:Snapshot)
    RETURN s
    ORDER BY s.createdAt DESC
  `, { pageId });
  return result.records.map((r: any) => parseNodeContent(r.get('s')));
}

// Summaries
export async function saveSummary(
  pageId: string,
  previousSnapshotId: number,
  currentSnapshotId: number,
  summary: string,
  diffType: string
): Promise<Record<string, any>> {
  const result = await runQuery(`
    MATCH (p:TrackedPage) WHERE id(p) = toInteger($pageId)
    CREATE (s:Summary {
      summary: $summary,
      diffType: $diffType,
      createdAt: datetime()
    })
    CREATE (p)-[:HAS_SUMMARY]->(s)
    RETURN s
  `, { pageId, summary, diffType });
  const node = result.records[0].get('s');
  return { id: node.identity.toString(), ...node.properties };
}

export async function getSummaries(pageId: string): Promise<Record<string, any>[]> {
  const result = await runQuery(`
    MATCH (p:TrackedPage) WHERE id(p) = toInteger($pageId)
    MATCH (p)-[:HAS_SUMMARY]->(s:Summary)
    RETURN s
    ORDER BY s.createdAt DESC
  `, { pageId });
  return result.records.map((r: any) => nodeToObj(r.get('s')));
}

export async function getAllSummaries(): Promise<Record<string, any>[]> {
  const result = await runQuery(`
    MATCH (p:TrackedPage)-[:HAS_SUMMARY]->(s:Summary)
    RETURN p, s
    ORDER BY s.createdAt DESC
  `);
  return result.records.map((r: any) => {
    const page = r.get('p');
    const summary = r.get('s');
    return {
      id: summary.identity.toString(),
      ...summary.properties,
      url: page.properties.url,
      name: page.properties.name,
    };
  });
}