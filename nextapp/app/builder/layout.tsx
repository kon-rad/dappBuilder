'use client';

import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white h-full p-4">
      <h2 className="text-xl font-bold mb-4">Components</h2>
      <ul className="space-y-2">
        <li className="p-2 hover:bg-gray-800 rounded cursor-pointer">Smart Contracts</li>
        <li className="p-2 hover:bg-gray-800 rounded cursor-pointer">Web3 Functions</li>
        <li className="p-2 hover:bg-gray-800 rounded cursor-pointer">Authentication</li>
        <li className="p-2 hover:bg-gray-800 rounded cursor-pointer">Storage</li>
      </ul>
    </div>
  );
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">DappBuilder</h1>
        <p className="text-gray-300">
          Build your decentralized application visually by connecting components
        </p>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}