import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Layout } from '@/components/Layout';

export const metadata: Metadata = {
  title: 'AI Task Planner',
  description: 'Manage, prioritize, and track all tasks with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
