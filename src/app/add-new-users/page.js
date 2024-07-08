// src/app/add-new-users

'use client';
import { useState } from 'react';
import { auth, database } from '@/config/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navigation from '@/components/navigation';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    // const [accessGranted, setAccessGranted] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(response.user, {
                displayName: name,
            });

            const userRef = ref(database, 'users/' + response.user.uid);
            await set(userRef, {
                name: name,
                email: email,
            });

            setEmail('');
            setPassword('');
            setName('');
            toast.success('創建成功！');
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    };

    // if (!accessGranted) {
    //     return (
    //         <>
    //             <Navigation />
    //             <PasswordUnlock onUnlock={() => setAccessGranted(true)} />
    //         </>
    //     );
    // }

    return (
        <>
            <Navigation />
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <h1>註冊頁</h1>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleRegister}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="請輸入信箱"
                        style={{ color: 'black' }}
                        autoComplete="email"
                    />
                    <br /><br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="請輸入密碼"
                        style={{ color: 'black' }}
                        autoComplete="current-password"
                    />
                    <br /><br />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="請輸入名字"
                        style={{ color: 'black' }}
                        autoComplete="name"
                    />
                    <br /><br />
                    <button type="submit">[ 創建 ]</button>
                </form>
            </div>
            <ToastContainer />
        </>
    );
}
