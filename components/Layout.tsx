"use client";

import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {showHeader && <Header />}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
