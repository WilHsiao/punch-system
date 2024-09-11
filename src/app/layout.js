// Global Layout

import { Inter } from "next/font/google";
import "./globals.css";
<<<<<<< Updated upstream
import ClientRootLayout from './ClientRootLayout';

const inter = Inter({ subsets: ["latin"] });

// 服務器組件，用於定義 metadata
=======
import Navigation2 from '@/components/navigation2';
import Navigation from '@/components/navigation';


const inter = Inter({ subsets: ["latin"] });


>>>>>>> Stashed changes
export const metadata = {
  title: "翰霖文教機構內部系統",
  description: "我是翰霖內部管理系統，提供諸如：打卡、考勤、點名、學收、教材訂購等內部功能。如有任何疑問請洽翰霖管理部。",
};

<<<<<<< Updated upstream
// 服務器組件的 RootLayout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRootLayout>{children}</ClientRootLayout>
=======
export default function RootLayout({children,})
{

  return (
    <html lang="en">
      <body className={inter.className}>
        {/*<AuthProvider><EventProvider>*/}
          <Navigation />
          {/*<Navigation2 />*/}
          {children}
        {/*</EventProvider></AuthProvider>*/}
        <footer className="w-full flex items-center justify-center py-4 bg-gray-800 text-white text-sm">
          © 2024 蕭楡 & 賴彤兒
        </footer>
>>>>>>> Stashed changes
      </body>
    </html>
  );
}