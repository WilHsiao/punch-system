// src/components/navigation

'use client';

import Link from 'next/link';

export default function Navigation(){
  return (
    <>
      <nav className="w-full bg-gray-500 py-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="text-2xl font-bold">[ 首頁 ]</a>
          </Link>
          <div className="flex space-x-4">
            <Link href="/punch-system" legacyBehavior>
              <a className="text-2xl font-bold">[ 打卡系統 ]</a>
            </Link>
            <Link href="/login" legacyBehavior>
              <a className="text-2xl font-bold">[ 登入 ]</a>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}