// src/components/punch-system-nav

'use client';

import Link from 'next/link';

export default function PunchSystemNav(){
  return (
    <>
      <nav className="w-full bg-gray-400 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Link href="/punch-system/punch-v2" legacyBehavior>
              <a className="text-lg font-bold">[ 打卡 ]</a>
            </Link>
            <Link href="/punch-system/punch-manual" legacyBehavior>
              <a className="text-lg font-bold">[ 補打卡 ]</a>
            </Link>
          </div>
      </nav>
    </>
  );
}