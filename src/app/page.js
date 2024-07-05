// src/app/home

import Navigation from '@/components/navigation';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <h1>打卡系統 v.2</h1>
          <p>我是首頁我是首頁我是首頁我是首頁我是首頁我是首頁我是首頁我是首頁</p>
        </div>
      </main>
    </>
  );
}
