// */register

'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '@/config/firebaseConfig'; // 确保你已配置 Firebase 和 Realtime Database
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user'); // 默认为一般用户
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('密碼與確認密碼不符');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 在 Realtime Database 中存储用户角色
            await set(ref(database, 'users/' + user.uid), {
                email: user.email,
                role: role,
            });

            toast.success('註冊成功！', { autoClose: 1000 });
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            setError('註冊失敗，請填寫正確的電子郵件和密碼。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg" style={{ marginTop: '-15%' }}>
                    <form onSubmit={handleRegister} className="flex flex-col items-center w-full">
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
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="mb-3 w-full flex items-center">
                            <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">確認密碼</h2>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="請再次輸入密碼"
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="mb-3 w-full flex items-center">
                            <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">角色</h2>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            >
                                <option value="user">一般會員</option>
                                <option value="admin">管理員</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                            disabled={loading}
                        >
                            註冊
                        </button>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </>
    );
}
