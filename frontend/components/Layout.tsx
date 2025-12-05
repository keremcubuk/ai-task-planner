import React from 'react';
import Link from 'next/link';
import { Home, PieChart, Folder } from 'lucide-react';
import { useRouter } from 'next/router';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  
  const isActive = (path: string) => router.pathname === path ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex-shrink-0 flex items-center text-xl font-bold text-gray-900">
                Local AI Planner
              </Link>
              <nav className="ml-8 flex space-x-8 h-full">
                <Link href="/" className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${isActive('/')}`}>
                  <Home size={18} className="mr-2"/> Dashboard
                </Link>
                <Link href="/projects" className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${isActive('/projects')}`}>
                  <Folder size={18} className="mr-2"/> Projects
                </Link>
                <Link href="/analytics" className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${isActive('/analytics')}`}>
                  <PieChart size={18} className="mr-2"/> Analytics
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
