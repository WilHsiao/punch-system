// @/components/navigation.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useIamAccess } from '@/hooks/iam-access';
import { FaHome, FaUserShield, FaClock, FaTasks, FaSignInAlt, FaBars, FaChevronLeft } from 'react-icons/fa'; // Import icons

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Controls overall navigation visibility
  const [isCollapsed, setIsCollapsed] = useState(false); // Controls sidebar collapse
  const [isPunchSystemOpen, setIsPunchSystemOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const { user } = useAuth();
  const { userRole, isLoading } = useIamAccess();

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

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const togglePunchSystem = useCallback(() => {
    setIsPunchSystemOpen(prev => !prev);
  }, []);

  // Function to close the navigation on mobile after item click
  const handleNavItemClick = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const isPunchSystemPage = pathname.startsWith('/punch-system');

  if (!isMounted) {
    return (
      <div className="h-16 bg-gray-800">
        {/* Loading skeleton */}
      </div>
    );
  }

  const allPunchSystemLinks = [
    { href: '/punch-system/main-punch', text: '打卡機', requiredRoles: ['打卡機'] },
    { href: '/punch-system/punch-manual', text: '補打卡', requiredRoles: ['主管'] },
    { href: '/punch-system/query-punch-data', text: '查詢所有打卡資料', requiredRoles: ['主管'] },
    { href: '/punch-system/query-student-data', text: '查詢學生報到資料', requiredRoles: ['主管', '老師'] },
    { href: '/punch-system/query-self-data', text: '我的紀錄', requiredRoles: ['主管', '老師'] },
    { href: '/punch-system/attendance', text: '分部人員狀況', requiredRoles: ['主管', '老師'] },
  ];

  const MainNavLinks = () => (
    <div className="flex flex-col space-y-4 mt-12">
      <Link href="/" legacyBehavior>
        <a
          onClick={handleNavItemClick} // Close menu on click
          className={`flex items-center text-xl font-bold text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300 ${pathname === '/' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <FaHome className={`mr-2 ${isCollapsed ? 'text-2xl block' : 'text-xl'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>首頁</span>
        </a>
      </Link>
      <Link href="/authorization" legacyBehavior>
        <a
          onClick={handleNavItemClick} // Close menu on click
          className={`flex items-center text-xl font-bold text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300 ${pathname === '/authorization' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <FaUserShield className={`mr-2 ${isCollapsed ? 'text-2xl block' : 'text-xl'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>打卡機授權</span>
        </a>
      </Link>
      <button
        onClick={() => {
          togglePunchSystem();
          handleNavItemClick(); // Close menu on click
        }}
        className="flex items-center text-xl font-bold text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300"
      >
        <FaClock className={`mr-2 ${isCollapsed ? 'text-2xl block' : 'text-xl'}`} />
        <span className={`${isCollapsed ? 'hidden' : 'block'}`}>打卡系統</span>
      </button>
      {isPunchSystemOpen && <PunchSystemNavLinks />}
      <Link href="/login" legacyBehavior>
        <a
          onClick={handleNavItemClick} // Close menu on click
          className={`flex items-center text-xl font-bold text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300 ${pathname === '/login' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <FaSignInAlt className={`mr-2 ${isCollapsed ? 'text-2xl block' : 'text-xl'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>登入／登出</span>
        </a>
      </Link>
      <Link href="/tasks" legacyBehavior>
        <a
          onClick={handleNavItemClick} // Close menu on click
          className={`flex items-center text-xl font-bold text-white px-3 py-2 rounded hover:bg-blue-700 transition duration-300 ${pathname === '/tasks' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <FaTasks className={`mr-2 ${isCollapsed ? 'text-2xl block' : 'text-xl'}`} />
          <span className={`${isCollapsed ? 'hidden' : 'block'}`}>分部需求表</span>
        </a>
      </Link>
    </div>
  );

  const PunchSystemNavLinks = () => {
    if (isLoading || !userRole) {
      return null;
    }

    const filteredLinks = allPunchSystemLinks.filter(link =>
      userRole === '主管'
        ? link.text !== '打卡機'
        : link.requiredRoles.includes(userRole)
    );

    return (
      <div className={`flex flex-col space-y-2 pt-4 ${isCollapsed ? 'items-center' : ''}`}>
        {filteredLinks.map(({ href, text }) => (
          <Link key={href} href={href} legacyBehavior>
            <a
              onClick={handleNavItemClick}
              className={`flex items-center text-lg font-bold bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400 transition duration-300 ${
                pathname === href ? 'bg-blue-600' : ''
              } ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}`}
              title={text}
            >
              {isCollapsed ? (
                <span className="text-s">{text.slice(0, 1)}</span>
              ) : (
                text
              )}
            </a>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          onClick={toggleMenu} 
          className="fixed top-4 left-4 z-50 text-white bg-blue-500 p-2 rounded"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FaChevronLeft className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      )}

      {/* Navigation */}
      <nav
        className={`fixed left-0 top-0 h-screen bg-gray-900 flex flex-col
          ${isMobile
            ? isOpen ? 'w-64 p-4' : 'w-0'
            : isCollapsed ? 'w-16 p-4' : 'w-64 p-4'
          } transition-all duration-300 shadow-lg z-20 overflow-hidden`}
      >
        {(!isMobile || isOpen) && <MainNavLinks />}
      </nav>

      {/* Desktop Collapse Button */}
      {!isMobile && (
        <button 
          onClick={toggleSidebar} 
          className="fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FaBars className="w-6 h-6" /> : <FaChevronLeft className="w-6 h-6" />}
        </button>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 p-4 ${isMobile ? 'ml-0' : `ml-${isCollapsed ? '16' : '64'}`}`}>
        {/* Content goes here */}
      </div>
    </div>
  );
}
