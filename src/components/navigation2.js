// @/components/navigation.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isPunchSystemPage = pathname.startsWith('/punch-system');

  const MainNavLinks = () => (
    <>
      <Link href="/" legacyBehavior>
        <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">首頁</a>
      </Link>
      <div className="flex space-x-4 ml-auto">
        <Link href="/punch-system" legacyBehavior>
          <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">打卡系統</a>
        </Link>
        <Link href="/authorization" legacyBehavior>
          <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">授權</a>
        </Link>
        <Link href="/login" legacyBehavior>
          <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">登入／登出</a>
        </Link>
      </div>
    </>
  );

  const PunchSystemNavLinks = () => (
    <>
      <Link href="/punch-system/punch-v2" legacyBehavior>
        <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
          打卡機
        </a>
      </Link>
      <Link href="/punch-system/punch-manual" legacyBehavior>
        <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
          補打卡
        </a>
      </Link>
      <Link href="/punch-system/query-punch-data" legacyBehavior>
        <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
          查詢所有打卡
        </a>
      </Link>
      <Link href="/punch-system/query-student-data" legacyBehavior>
        <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
          查詢學生報到資料
        </a>
      </Link>
      <Link href="/punch-system/query-self-data" legacyBehavior>
        <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
          我的紀錄
        </a>
      </Link>
    </>
  );

  return (
    <nav className={`fixed py-4 top-0 left-0 h-full bg-gray-800 transform ${isMobile && isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
      <div className="max-w-7xl mx-auto px-4">
        {isMobile ? (
          <div>
            <button onClick={toggleMenu} className="text-white mt-4 ml-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {isOpen && (
              <div className="mt-4 flex flex-col space-y-2">
                <MainNavLinks />
                {isPunchSystemPage && (
                  <>
                    <div className="border-t border-gray-600 my-2"></div>
                    <PunchSystemNavLinks />
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center px-10">
              <MainNavLinks />
            </div>
            {isPunchSystemPage && (
              <div className="mt-4 flex justify-center space-x-4">
                <PunchSystemNavLinks />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
