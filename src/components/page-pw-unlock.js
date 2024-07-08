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
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1>請輸入密碼</h1>
            <form onSubmit={(e) => { e.preventDefault(); checkAccessPassword(); }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="訪問密碼"
                    style={{ color: 'black' }}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                    />
                    顯示密碼
                </label>
                <br />
                <button type="submit">[ 提交 ]</button>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
            </form>
            <ToastContainer />
        </div>
    );
}
