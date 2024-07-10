'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navigation(){
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
      } else {
        setCurrentUserEmail('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUserEmail('');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <>
      <nav className="w-full bg-gray-400 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="text-lg font-bold">首頁</a>
          </Link>
          <div className="flex space-x-4">
            <Link href="/punch-v2" legacyBehavior>
              <a className="text-lg font-bold">[打卡]</a>
            </Link>
            <Link href="/member-system" legacyBehavior>
              <a className="text-lg font-bold">[管理員專區]</a>
            </Link>
            {currentUserEmail && (
              <>
                <span className="text-lg font-bold">{currentUserEmail} 你好！</span>
                  <button
                    onClick={handleLogout}
                    className="text-lg font-bold"
                  >
                    登出 &gt;&gt;
                  </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}