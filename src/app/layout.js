// Global Layout

import { Inter } from "next/font/google";
import "./globals.css";
import Navigation2 from '@/components/navigation2';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "翰霖ERP系統",
  description: "我是翰霖ERP系統我是翰霖ERP系統我是翰霖ERP系統",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/*<AuthProvider><EventProvider>*/}
        <Navigation2 />
        {children}
        {/*</EventProvider></AuthProvider>*/}
        <footer className="w-full flex items-center justify-center py-4 bg-gray-800 text-white text-sm">
          © 2024 Yu
        </footer>
      </body>
    </html>
  );
}
