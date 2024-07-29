// @/components/punch-system-nav

'use client';

import Link from 'next/link';

export default function PunchSystemNav() {
  return (
    <>
      <nav className="w-full bg-gray-600 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Link href="/punch-system/punch-v2" legacyBehavior>
            <a className="text-lg font-bold bg-blue-300 text-black px-4 py-2 rounded hover:bg-blue-400 transition duration-300">
              一般打卡【主管】
            </a>
          </Link>
          <Link href="/punch-system/punch-manual" legacyBehavior>
            <a className="text-lg font-bold bg-blue-300 text-black px-4 py-2 rounded hover:bg-blue-400 transition duration-300">
              補打卡【主管】
            </a>
          </Link>
          <Link href="/punch-system/query-punch-data" legacyBehavior>
            <a className="text-lg font-bold bg-blue-300 text-black px-4 py-2 rounded hover:bg-blue-400 transition duration-300">
              查詢資料【主管】
            </a>
          </Link>
          <Link href="/query-student-data" legacyBehavior>
            <a className="text-lg font-bold bg-blue-300 text-black px-4 py-2 rounded hover:bg-blue-400 transition duration-300">
              查詢學生報到資料
            </a>
          </Link>
          <Link href="/punch-system/query-self-data" legacyBehavior>
            <a className="text-lg font-bold bg-blue-300 text-black px-4 py-2 rounded hover:bg-blue-400 transition duration-300">
              我的紀錄
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
}