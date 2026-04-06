import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yacht Tracker',
  description: 'Track yacht listings and get AI-powered summaries of changes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}