// app/ClientRootLayout.js

'use client';

import Navigation from '@/components/navigation';
import { AuthProvider } from '@/context/auth-context';

export default function ClientRootLayout({ children }) {
  return (
    <>
      <AuthProvider>
        <Navigation />
        {children}
      </AuthProvider>
      <footer className="w-full flex items-center justify-center py-4 bg-gray-800 text-white text-sm">
        © 2024 Yu
      </footer>
    </>
  );
}