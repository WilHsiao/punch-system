// */login

'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
                setEmail('');
                setPassword('');
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('登入成功！', { autoClose: 1000 });
        } catch (error) {
            console.error(error);
            setError('登入失敗，請填寫正確的電子郵件和密碼。');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.info('已登出', { autoClose: 1000 });
            setUser(null);
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error(error);
            toast.error('登出失敗，請重試');
        }
    };

    if (loading) {
        return <div className="flex flex-col items-center justify-center h-1/3 p-24">載入中...</div>;
    }

    return (
    	<>
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg" style={{ marginTop: '-15%' }}>
              {user ? (
                <>
                  <h1 className="text-xl font-bold mb-4">{user.email}, 你好！</h1>
                  <button
                    onClick={handleLogout}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-4">登入頁面</h1>
                  <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入信箱"
                      className="mb-3 w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoComplete="email"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="請輸入密碼"
                      className="mb-3 w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoComplete="current-password"
                    />
                    <button
                      type="submit"
                      className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                      登入
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
