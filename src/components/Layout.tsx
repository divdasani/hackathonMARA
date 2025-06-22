import React from 'react';
import { Link } from 'react-router-dom';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  return <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                Inference Token Marketplace
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Home
              </Link>
              <Link to="/buy" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Buy
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>;
}