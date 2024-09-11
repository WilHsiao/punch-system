// Global Layout

import { Inter } from "next/font/google";
import "./globals.css";
import ClientRootLayout from './ClientRootLayout';

const inter = Inter({ subsets: ["latin"] });

// 服務器組件，用於定義 metadata
export const metadata = {
  title: "翰霖 ERP 系統",
  description: "我是翰霖ERP系統",
};

// 服務器組件的 RootLayout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}