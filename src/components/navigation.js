// @/components/navigation

'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <>
      <nav className="w-full bg-gray-800 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
          <Link href="/" legacyBehavior>
            <a className="text-2xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">首頁</a>
          </Link>
          <div className="flex space-x-6">
            <Link href="/punch-system" legacyBehavior>
              <a className="text-2xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">打卡系統</a>
            </Link>
            <Link href="/authorization" legacyBehavior>
              <a className="text-2xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">授權</a>
            </Link>
            <Link href="/login" legacyBehavior>
              <a className="text-2xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">登入／登出</a>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}