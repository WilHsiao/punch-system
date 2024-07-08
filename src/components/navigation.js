'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { auth, database } from '@/config/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function Navigation(){
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserEmail(user.email);

        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          setCurrentUserName(userData.name);
        } else {
            console.log("No data available");
        }
      } else {
            setCurrentUserEmail('');
            setCurrentUserName('');
        }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUserEmail('');
      setCurrentUserName('');
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
            <Link href="/punch" legacyBehavior>
              <a className="text-lg font-bold">[打卡]</a>
            </Link>
            <Link href="/add-new-users" legacyBehavior>
              <a className="text-lg font-bold">[新增使用者]</a>
            </Link>
            <Link href="/member-system" legacyBehavior>
              <a className="text-lg font-bold">[會員中心]</a>
            </Link>
            {currentUserEmail && (
              <>
                <span className="text-lg font-bold">{currentUserName} 你好！</span>
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