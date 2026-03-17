'use client';

import React from 'react';
import Link from 'next/link';
import { Home, PieChart, Folder, Calendar, ClipboardCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path
      ? 'text-blue-600 border-blue-500'
      : 'text-gray-500 border-transparent hover:text-blue-600 hover:border-blue-300';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link
                href="/"
                className="flex flex-shrink-0 items-center text-xl font-bold text-gray-900"
              >
                Local AI Planner
              </Link>
              <nav className="ml-8 flex h-full space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive('/')}`}
                >
                  <Home size={18} className="mr-2" /> Dashboard
                </Link>
                <Link
                  href="/projects"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive('/projects')}`}
                >
                  <Folder size={18} className="mr-2" /> Projects
                </Link>
                <Link
                  href="/calendar"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive('/calendar')}`}
                >
                  <Calendar size={18} className="mr-2" /> Calendar
                </Link>
                <Link
                  href="/project-review-scores"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive('/project-review-scores')}`}
                >
                  <ClipboardCheck size={18} className="mr-2" /> Reviews
                </Link>
                <Link
                  href="/analytics"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${isActive('/analytics')}`}
                >
                  <PieChart size={18} className="mr-2" /> Analytics
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};
