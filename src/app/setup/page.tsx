'use client';

export default function SetupPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1b2e 100%)', padding: '24px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: '28px' }}>⛵ Yacht Tracker - Setup</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Configure your environment to get started</p>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 24px', color: '#1e293b' }}>Step 1: Create a Neo4j Database</h2>
          <ol style={{ paddingLeft: '24px', lineHeight: 1.8, color: '#475569' }}>
            <li>Go to <a href="https://neo4j.com/aura/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>neo4j.com/aura</a></li>
            <li>Click <strong>"Try Free"</strong> and create your account</li>
            <li>Create a new database with the free tier</li>
            <li>Save the <strong>connection string</strong>, <strong>username</strong>, and <strong>password</strong></li>
          </ol>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 24px', color: '#1e293b' }}>Step 2: Add Environment Variables in Vercel</h2>
          <p style={{ color: '#475569', marginBottom: '16px' }}>Go to your Vercel project → Settings → Environment Variables and add:</p>
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto' }}>
            <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b' }}># Neo4j Database (from Step 1)</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#ef4444' }}>NEO4J_URI</span>=neo4j+s://your-instance.databases.neo4j.io</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#ef4444' }}>NEO4J_USER</span>=neo4j</div>
            <div style={{ marginBottom: '12px' }}><span style={{ color: '#ef4444' }}>NEO4J_PASSWORD</span>=your_password</div>
            <div style={{ marginBottom: '8px' }}><span style={{ color: '#64748b' }}># Z.ai API</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#10b981' }}>ZAI_API_KEY</span>=4d1f35ccff00479ebafc5140d2b56220.LDSPmIyb4jwb6fbh</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#10b981' }}>ZAI_MODEL</span>=glm-5.1</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#10b981' }}>ZAI_BASE_URL</span>=https://api.z.ai/api/coding/paas/v4</div>
            <div><span style={{ color: '#64748b' }}># Cron Secret</span></div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#f59e0b' }}>CRON_SECRET</span>=f2ca1f2e0b7b85d8d5f31ea4e0e41ca9e338a8625a52f8a62f5aaa194d39f3c5</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#1e40af' }}>ℹ️ Note</h3>
          <p style={{ margin: '0 0 12px', color: '#1e3a8a', fontSize: '14px' }}>
            After adding the environment variables, Vercel will automatically redeploy. 
            The database tables (nodes and relationships) will be created automatically on first use.
          </p>
          <p style={{ margin: 0, color: '#1e3a8a', fontSize: '14px' }}>
            <a href="/" style={{ color: '#2563eb' }}>← Back to Dashboard</a>
          </p>
        </div>
      </main>
    </div>
  );
}