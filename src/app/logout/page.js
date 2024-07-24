// logout

'use client';
import { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { app, auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LogoutPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 顯示成功消息
      toast.info('已登出', { autoClose: 1000 });
      // 清空用戶狀態
      setUser(null);
    } catch (error) {
      console.error(error);
      // 顯示錯誤消息
      toast.error('登出失敗，請重試');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
            {user && (
                <button
                onClick={handleLogout}
                className="mt-4 px-8 py-4 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300 text-xl"
              >
                登出
              </button>
              
            )}
        </div>
        <ToastContainer />
    </main>
  );
};

export default LogoutPage;