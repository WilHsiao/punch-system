// src/pages/member-system

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
        <div className="flex flex-col items-center justify-start h-1/3 p-24">
            {user ? (
                    <>
                        <h1>{user.email}, 你好！</h1>
                        <button onClick={handleLogout}>[ 登出 ]</button>
                    </>
                ) : (
                    <>
                        <h1>登入頁面</h1>
                        <form onSubmit={handleLogin} className="flex flex-col items-center">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="請輸入信箱"
                                style={{ color: 'black', marginBottom: '10px' }}
                                autoComplete="email"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="請輸入密碼"
                                style={{ color: 'black', marginBottom: '10px' }}
                                autoComplete="current-password"
                            />
                            <button type="submit">登入</button>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </form>
                    </>
                )}
                <ToastContainer />
            </div>
        </>
    );
}
