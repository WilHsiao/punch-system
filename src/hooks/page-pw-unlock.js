// @/hooks/page-pw-unlock

import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PasswordUnlock({ onUnlock }) {
  const [accessPassword, setAccessPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const checkAccessPassword = () => {
    if (accessPassword === '123123123') {
      onUnlock();
      setAuthError('');
    } else {
      setAuthError('密碼錯誤');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
              <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-700 text-center">請輸入密碼</h1>
        <form onSubmit={(e) => { e.preventDefault(); checkAccessPassword(); }} className="w-full flex flex-col items-center space-y-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            placeholder="芝麻請開門！"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="form-checkbox"
            />
            <span className="text-gray-700">顯示密碼</span>
          </label>
          <button
          type="submit"
          className="w-3/5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300 mt-4"
          >
            提交
          </button>
          {authError && <p className="text-red-500">{authError}</p>}
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}
