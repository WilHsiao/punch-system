// Punch system layout

import Link from 'next/link';
import PunchSystemNav from '@/components/punch-system-nav';

export const metadata = {
  title: "打卡系統",
  description: "我是打卡系統我是打卡系統我是打卡系統",
};

export default function PunchSystemLayout({ children }) {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <PunchSystemNav />
        <header className="bg-gray-100 py-2">
          <h1 className="max-w-5xl mx-auto text-lg text-gray-600 flex items-center px-4">
            ERP系統&nbsp;&nbsp;▻&nbsp;&nbsp;打卡系統
          </h1>
        </header>
        <main className="flex-grow py-8">
          <div className="max-w-5xl mx-auto px-4">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
