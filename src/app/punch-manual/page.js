// src/pages/punch-manual.js

'use client';
import { useState, useEffect } from 'react';
import { database, auth } from '@/config/firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PunchManual() {
    const [uid, setUid] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [punchType, setPunchType] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                toast.info("歡迎使用打卡系統！", { autoClose: 2000 });
            } else {
                toast.error('請前往管理員專區登入！', { autoClose: 2000 });
            }
        });

        return () => unsubscribe();
    }, []);

    const handleManualPunch = async () => {
        if (!uid || !date || !time || !punchType) {
            toast.error('請完整填寫所有欄位！', { autoClose: 2000 });
            return;
        }

        try {
            const punchTimestamp = new Date(`${date}T${time}`).getTime();
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                setName(userData.name);

                const punchData = { timestamp: punchTimestamp, type: punchType };
                const punchRef = ref(database, `punches/${uid}/${new Date(punchTimestamp).toISOString().replace(/\W/g, '')}`);
                await set(punchRef, punchData);
                console.log("Punch recorded successfully.");
                toast.success(`${userData.name} 的補打卡成功！`, { autoClose: 2000 });
                setUid('');
                setTime('');
                setDate('');
            } else {
                toast.error('用戶不存在！', { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error handling manual punch: ", error);
            toast.error('補打卡過程出現錯誤', { autoClose: 2000 });
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center h-1/3 space-y-6 p-24">
                <h1>補打卡系統</h1>
                <div className="flex flex-col items-center">
                    <input
                        type="text"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        placeholder="請輸入用戶 UID"
                        style={{ marginBottom: '10px' }}
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <div className="flex items-center justify-center space-x-2">
                        <label htmlFor="punchType" className="mb-2">打卡類型:</label>
                        <div className="p-2 border border-gray-300">
                            <div>
                                <input
                                    type="radio"
                                    id="punchTypeStart"
                                    name="punchType"
                                    value="上班"
                                    checked={punchType === "上班"}
                                    onChange={(e) => setPunchType(e.target.value)}
                                />
                                <label htmlFor="punchTypeStart" className="ml-2">上班</label>
                            </div>
                            <div>
                                <input
                                    type="radio"
                                    id="punchTypeEnd"
                                    name="punchType"
                                    value="下班"
                                    checked={punchType === "下班"}
                                    onChange={(e) => setPunchType(e.target.value)}
                                />
                                <label htmlFor="punchTypeEnd" className="ml-2">下班</label>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleManualPunch}>[ 提交補打卡 ]</button>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
