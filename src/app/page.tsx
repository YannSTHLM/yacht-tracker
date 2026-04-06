'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Summary {
  id: number;
  summary: string;
  diff_type: string;
  created_at: string;
  url: string;
  name: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');

  const { data: summariesData, mutate: mutateSummaries } = useSWR(
    '/api/summaries',
    fetcher
  );

  const { data: pagesData, mutate: mutatePages } = useSWR(
    '/api/capture',
    fetcher
  );

  const summaries: Summary[] = summariesData?.summaries || [];
  const pages: Array<{ id: number; url: string; name: string; created_at: string }> = pagesData?.pages || [];

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsAdding(true);
    setMessage('');

    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          name: name || url,
          listings: [], // Empty - browser extension will send actual listings
          manual: true,
        }),
      });

      if (response.ok) {
        setMessage('Page added successfully! Install the browser extension to start capturing.');
        setUrl('');
        setName('');
        mutatePages();
      } else {
        setMessage('Failed to add page.');
      }
    } catch (err) {
      setMessage('Error adding page.');
    } finally {
      setIsAdding(false);
    }
  };

  const diffTypeColors: Record<string, string> = {
    new_ads: '#10b981',
    removed: '#ef4444',
    mixed: '#f59e0b',
    no_change: '#6b7280',
  };

  const diffTypeLabels: Record<string, string> = {
    new_ads: '🆕 New Listings',
    removed: '🗑️ Removed Listings',
    mixed: '🔄 Mixed Changes',
    no_change: '✅ No Changes',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1b2e 100%)',
          padding: '24px 0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '0 20px',
          }}
        >
          <h1 style={{ margin: 0, color: '#fff', fontSize: '28px' }}>
            ⛵ Yacht Tracker
          </h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Track yacht listings and get AI-powered summaries of changes
          </p>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Add Page Section */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b' }}>
            Add Page to Track
          </h2>
          <form onSubmit={handleAddPage}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="https://yacht-broker-site.com/listings"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '250px',
                  padding: '12px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <input
                type="text"
                placeholder="Optional name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '180px',
                }}
              />
              <button
                type="submit"
                disabled={isAdding}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1e3a5f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isAdding ? 'wait' : 'pointer',
                  fontWeight: '600',
                }}
              >
                {isAdding ? 'Adding...' : 'Add Page'}
              </button>
            </div>
          </form>
          {message && (
            <p
              style={{
                marginTop: '12px',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Monitored Pages */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b' }}>
            Monitored Pages ({pages.length})
          </h2>
          {!pages.length ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              No pages monitored yet. Add a page above and use the browser extension to capture listings.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '15px', fontWeight: '600' }}>
                        {page.name || page.url}
                      </p>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none', wordBreak: 'break-all' }}
                      >
                        {page.url}
                      </a>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      Added {new Date(page.created_at).toLocaleDateString('en-SE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extension Info */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '15px' }}>
            Browser Extension
          </h3>
          <p style={{ margin: '0 0 12px', color: '#1e3a8a', fontSize: '13px' }}>
            Install the browser extension to capture yacht listings when browsing.
            The extension sends data to this dashboard for analysis.
          </p>
          <code
            style={{
              backgroundColor: '#dbeafe',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'block',
            }}
          >
            Extension folder: ./extension (load as unpacked in Chrome/Edge)
          </code>
        </div>

        {/* Summaries */}
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b' }}>
          Recent Changes
        </h2>

        {!summaries.length ? (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ color: '#94a3b8' }}>
              No changes tracked yet. Add a page and use the browser extension to start capturing.
            </p>
          </div>
        ) : (
          summaries.map((summary) => (
            <div
              key={summary.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${diffTypeColors[summary.diff_type] || '#6b7280'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: `${diffTypeColors[summary.diff_type]}20`,
                      color: diffTypeColors[summary.diff_type],
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '8px',
                    }}
                  >
                    {diffTypeLabels[summary.diff_type] || summary.diff_type}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {new Date(summary.created_at).toLocaleString('en-SE')}
                  </span>
                </div>
              </div>
              <p
                style={{
                  margin: '0 0 8px',
                  color: '#1e293b',
                  fontSize: '14px',
                  whiteSpace: 'pre-line',
                }}
              >
                {summary.summary}
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
                📍 {summary.url}
              </p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}