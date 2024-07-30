// @/components/navigation.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPunchSystemOpen, setIsPunchSystemOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);


  const togglePunchSystem = useCallback(() => {
    setIsPunchSystemOpen(prev => !prev);
  }, []);

  const isPunchSystemPage = pathname.startsWith('/punch-system');

  if (!isMounted) {
    return (
      <div className="h-16 bg-gray-800">
        {/* 骨架屏 */}
      </div>
    );
  }

  const MainNavLinks = () => (
    <>
      <Link href="/" legacyBehavior>
        <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">首頁</a>
      </Link>
      <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex space-x-4 ml-auto items-center'}`}>
        <div className="relative">
          {isMobile ? (
            <button
              onClick={togglePunchSystem}
              className="w-full text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300 text-left"
            >
              打卡系統
            </button>
          ) : (
            <Link href="/punch-system" legacyBehavior>
              <a className="text-xl font-bold bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300">打卡系統</a>
            </Link>
          )}
          {isMobile && isPunchSystemOpen && <PunchSystemNavLinks />}
        </div>
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
    <div className={`${isMobile ? 'flex flex-col space-y-2 pt-4' : 'flex justify-center space-x-4 pt-4'}`}>
      {[
        { href: '/punch-system/punch-v2', text: '打卡機' },
        { href: '/punch-system/punch-manual', text: '補打卡' },
        { href: '/punch-system/query-punch-data', text: '查詢所有打卡' },
        { href: '/punch-system/query-student-data', text: '查詢學生報到資料' },
        { href: '/punch-system/query-self-data', text: '我的紀錄' },
      ].map(({ href, text }) => (
        <Link key={href} href={href} legacyBehavior>
          <a className="text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300">
            {text}
          </a>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {isMobile && (
        <button onClick={toggleMenu} className="fixed top-4 left-4 z-50 text-white bg-blue-500 p-2 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <nav className={`nav-mobile ${isOpen ? 'open' : ''}`}>
        <div className={`${isMobile ? 'px-4 py-4' : 'max-w-7xl mx-auto px-4 py-4'}`}>
          <div className={`${isMobile ? 'flex flex-col space-y-2 mt-16' : 'flex justify-between items-center'}`}>
            <MainNavLinks />
          </div>
          {!isMobile && isPunchSystemPage && (
            <>
              {isMobile && <div className="border-t border-gray-600"></div>}
              <PunchSystemNavLinks />
            </>
          )}
        </div>
      </nav>
    </>
  );
}
