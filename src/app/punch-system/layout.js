import Link from 'next/link';
import PunchSystemNav from '@/components/punch-system-nav';

export default function PunchSystemLayout({ children }) {
  return (
    <>
      <div>
      <PunchSystemNav />
      <header>
        <h1>ERP系統 &gt; 打卡系統</h1>
      </header>
      <main>{children}</main>
      </div>
    </>
  );
}
