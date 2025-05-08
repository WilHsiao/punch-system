'use client';

import { useState, useEffect } from 'react';
import {
      signInWithEmailAndPassword,
      onAuthStateChanged, signOut,
      updatePassword,
      sendPasswordResetEmail, 
      verifyBeforeUpdateEmail, 
      reauthenticateWithCredential, 
      EmailAuthProvider 
} from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [newPassword, setNewPassword] = useState('');
      const [error, setError] = useState('');
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      const [showForgotPassword, setShowForgotPassword] = useState(false);
      const [showChangePassword, setShowChangePassword] = useState(false);
      const [showChangeEmail, setShowChangeEmail] = useState(false);
      const [confirmPassword, setConfirmPassword] = useState('');
      const [newEmail, setNewEmail] = useState('');
      const [currentPassword, setCurrentPassword] = useState('');

      useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                  if (user) {
                        setUser(user);
                  } else {
                        setUser(null);
                        setEmail('');
                        setPassword('');
                        setNewPassword('');
                        setNewEmail('');
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
                  toast.success('登出成功！', { autoClose: 1000 });
            } catch (error) {
                  console.error(error);
                  setError('登出失敗，請稍後再試。');
            }
      };

      const handleChangePassword = async (e) => {
            e.preventDefault();
            if (!newPassword || !confirmPassword) {
                  setError('請輸入新密碼和確認密碼。');
                  return;
            }
            if (newPassword !== confirmPassword) {
                  setError('兩次輸入的密碼不一致。');
                  return;
            }
            try {
                  await updatePassword(user, newPassword);
                  toast.success('密碼變更成功！', { autoClose: 1000 });
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowChangePassword(false);
            } catch (error) {
                  console.error(error);
                  // setError('密碼變更失敗，請稍後再試。');
                  if (error.code === 'auth/requires-recent-login') {
                        setError('您需要重新登入才能變更密碼。請登出後重新登入。');
                  } else {
                        setError('密碼變更失敗，請稍後再試。');
                  }
            }
      };

      // 新增修改信箱的功能
      const handleChangeEmail = async (e) => {
            e.preventDefault();
            setError('');
            if (!newEmail || !currentPassword) {
                  setError('請輸入新的電子郵件和當前密碼。');
                  return;
            }
            
            try {
                  // 首先確保用戶存在
                  if (!user) {
                        setError('用戶未登入，請先登入。');
                        return;
                  }
                  
                  // 嘗試重新驗證用戶
                  try {
                        console.log('開始重新驗證用戶身份...');
                        // 重新驗證用戶 - 使用正確的方式創建憑證
                        const credential = EmailAuthProvider.credential(
                              user.email, 
                              currentPassword
                        );
                        
                        // 重新驗證
                        await reauthenticateWithCredential(user, credential);
                        console.log('重新驗證成功！');
                        
                        // 這會先發送驗證郵件到新郵箱，用戶點擊驗證鏈接後才會更新郵箱
                        await verifyBeforeUpdateEmail(user, newEmail);
                        console.log('驗證郵件已發送到新的電子郵件地址！');
                        
                        toast.success('驗證郵件已發送到新的電子郵件地址，請前往查收並點擊驗證鏈接完成變更！', { autoClose: 1000 });
                        setNewEmail('');
                        setCurrentPassword('');
                        setShowChangeEmail(false);
                  } catch (reauthError) {
                        console.error('操作時發生錯誤:', reauthError);
                        
                        if (reauthError.code === 'auth/wrong-password') {
                              setError('密碼不正確，請輸入正確的當前密碼。');
                        } else if (reauthError.code === 'auth/too-many-requests') {
                              setError('嘗試次數過多，請稍後再試。');
                        } else if (reauthError.code === 'auth/invalid-credential') {
                              setError('無效的登入憑證，請確認密碼正確。');
                        } else if (reauthError.code === 'auth/requires-recent-login') {
                              // 如果用戶需要重新登入
                              setError('您需要重新登入才能變更電子郵件。請先登出，然後重新登入後再嘗試。');
                              if (confirm('需要重新登入才能變更電子郵件。您要現在登出嗎？')) {
                                    await handleLogout();
                              }
                        } else if (reauthError.code === 'auth/email-already-in-use') {
                              setError('此電子郵件已被使用。');
                        } else if (reauthError.code === 'auth/invalid-email') {
                              setError('電子郵件格式不正確。');
                        } else if (reauthError.code === 'auth/operation-not-allowed') {
                              setError('此操作不被允許，請確認您的 Firebase 設置。');
                        } else {
                              setError(`操作失敗: ${reauthError.message}`);
                        }
                  }
            } catch (error) {
                  console.error('變更電子郵件時發生錯誤:', error);
                  console.error('錯誤代碼:', error.code);
                  console.error('錯誤信息:', error.message);
                  setError(`電子郵件變更失敗: ${error.message}`);
            }
      };

      const resetAllForms = () => {
            setShowChangePassword(false);
            setShowChangeEmail(false);
            setNewPassword('');
            setConfirmPassword('');
            setNewEmail('');
            setCurrentPassword('');
            setError('');
      };

      const handleForgotPassword = async (e) => {
            e.preventDefault();
            if (!email) {
                  setError('請輸入電子郵件地址。');
                  return;
            }
            try {
                  await sendPasswordResetEmail(auth, email);
                  toast.success('重置密碼郵件已發送，請檢查您的郵箱。', { autoClose: 3000 });
                  setShowForgotPassword(false);
            } catch (error) {
                  console.error(error);
                  setError('發送重置密碼郵件失敗，請稍後再試。');
            }
      };

      if (loading) {
            return <div className="flex flex-col items-center justify-center h-1/3 p-24">載入中...</div>;
      }

      return (
            <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                  <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                        <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 登入頁面 】</h1>
                        {user ? (
                              <div className='flex flex-col items-center'>
                                    <h1 className="text-xl font-bold mb-4 text-gray-700">{user.email} 登入成功！</h1>
                                    {showChangePassword ? (
                                          <form onSubmit={handleChangePassword} className="flex flex-col items-center w-full">
                                                <div className="mb-3 w-full flex items-center">
                                                      <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">新密碼</h2>
                                                      <input
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="輸入新密碼"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                                      />
                                                </div>
                                                <div className="mb-3 w-full flex items-center">
                                                      <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">確認密碼</h2>
                                                      <input
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            placeholder="再次輸入新密碼"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                                      />
                                                </div>
                                                <button
                                                      type="submit"
                                                      className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300"
                                                >
                                                      確認變更密碼
                                                </button>
                                                <button
                                                      type="button"
                                                      onClick={resetAllForms}
                                                      className="mt-2 text-blue-500 hover:text-blue-700"
                                                >
                                                      取消
                                                </button>
                                          </form>
                                    ) : showChangeEmail ? (
                                          <form onSubmit={handleChangeEmail} className="flex flex-col items-center w-full">
                                                <div className="mb-3 w-full flex items-center">
                                                      <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">新信箱</h2>
                                                      <input
                                                            type="email"
                                                            value={newEmail}
                                                            onChange={(e) => setNewEmail(e.target.value)}
                                                            placeholder="請輸入新的電子郵件"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                                            autoComplete="email"
                                                      />
                                                </div>
                                                <div className="mb-3 w-full flex items-center">
                                                      <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">當前密碼</h2>
                                                      <input
                                                            type="password"
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            placeholder="請輸入當前密碼以驗證身份"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                                      />
                                                </div>
                                                <button
                                                      type="submit"
                                                      className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition duration-300"
                                                >
                                                      確認變更信箱
                                                </button>
                                                <button
                                                      type="button"
                                                      onClick={resetAllForms}
                                                      className="mt-2 text-blue-500 hover:text-blue-700"
                                                >
                                                      取消
                                                </button>
                                          </form>
                                    ) : (
                                          <div className="flex flex-col w-full gap-4">
                                                <button
                                                      onClick={handleLogout}
                                                      className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300"
                                                >
                                                      登出
                                                </button>
                                                <button
                                                      onClick={() => {
                                                            resetAllForms();
                                                            setShowChangePassword(true);
                                                      }}
                                                      className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                                                >
                                                      變更密碼
                                                </button>
                                                <button
                                                      onClick={() => {
                                                            resetAllForms();
                                                            setShowChangeEmail(true);
                                                      }}
                                                      className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-700 transition duration-300"
                                                >
                                                      變更信箱
                                                </button>
                                          </div>
                                    )}
                              </div>
                        ) : (
                              <>
                                    {showForgotPassword ? (
                                          <form onSubmit={handleForgotPassword} className="flex flex-col items-center w-full">
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
                                                <button
                                                      type="submit"
                                                      className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                                                >
                                                      發送重置密碼郵件
                                                </button>
                                                <button
                                                      type="button"
                                                      onClick={() => setShowForgotPassword(false)}
                                                      className="mt-2 text-blue-500 hover:text-blue-700"
                                                >
                                                      返回登入
                                                </button>
                                          </form>
                                    ) : (
                                          <>
                                                <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
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
                                                            登入
                                                      </button>
                                                </form>
                                                <button
                                                      type="button"
                                                      onClick={() => setShowForgotPassword(true)}
                                                      className="mt-2 text-blue-500 hover:text-blue-700"
                                                >
                                                      忘記密碼？
                                                </button>
                                          </>
                                    )}
                              </>
                        )}
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        <ToastContainer />
                  </div>
            </div>
      );
}