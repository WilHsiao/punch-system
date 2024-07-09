// src/pages/login

'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navigation from '@/components/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('登入成功，即將前往首頁！');

            // 登入成功後跳轉到首頁
            setTimeout(() => {
            	window.location.href = '/';
            },2000);
        } catch (error) {
            console.error(error);
            setError('登入失敗，請檢查您的電子郵件和密碼。');
            toast.error('登入失敗，請檢查您的電子郵件和密碼。');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('已成功登出');
            setUser(null);
        } catch (error) {
            console.error(error);
            toast.error('登出失敗，請重試');
        }
    };

    return (
    	<>
    	<Navigation />
        <div className="flex flex-col items-center justify-start h-1/3 p-24">
            {user ? (
                    <>
                        <h1>歡迎, {user.email}</h1>
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
