// /authorization
'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // 檢查用戶角色
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.role === '打卡機') {
            setAuthorized(true);
            toast.success('授權成功！', { autoClose: 1000 });
          } else {
            setAuthorized(false);
            toast.error('無法授權！', { autoClose: 1000 });
            await signOut(auth);  // 如果不是打卡機角色，立即登出
          }
        }
      } else {
        setUser(null);
        setAuthorized(false);
        setEmail('');
        setPassword('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 登入成功後，角色檢查會在 useEffect 中進行
    } catch (error) {
      console.error(error);
      setError('授權失敗，請填寫正確的電子郵件和密碼。');
      toast.error('授權失敗，請檢查您的信箱和密碼。', { autoClose: 1000 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return(
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
          <h1 className="text-2xl font-bold">載入中...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
        <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">【 授權 】</h1>
          {user && authorized ? (
            <div className='flex justify-center'>
              <h1 className="text-xl font-bold mb-4 text-gray-700">{user.email} 已授權！</h1>
            </div>
          ) : (
            <>
              <form onSubmit={handleAuth} className="flex flex-col items-center w-full">
                <div className="mb-3 w-full flex items-center">
                  <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">信箱</h2>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="請輸入信箱"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    autoComplete="email"
                  />
                </div>
                <div className="mb-3 w-full flex items-center">
                  <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">密碼</h2>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                  授權
                </button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </form>
            </>
          )}
          <ToastContainer />
        </div>
      </div>
    </>
  );
}
