// Global Layout

import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "簡易ERP系統",
  description: "我是簡易ERP系統我是簡易ERP系統我是簡易ERP系統",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/*<AuthProvider><EventProvider>*/}
          <Navigation />
          {children}
        {/*</EventProvider></AuthProvider>*/}
        <footer className="w-full flex items-center justify-center py-4 bg-gray-800 text-white text-sm">
          © 2024 Yu
        </footer>
      </body>
    </html>
  );
}
