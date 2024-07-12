// src/app/punch

'use client';
import { useState, useRef, useEffect } from 'react';
import { database, auth } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false }); // 動態加載 QrReader 組件，只在客戶端渲染

export default function Punch() {
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const [scanning, setScanning] = useState(true);
    const [punchType, setPunchType] = useState('');
    const lastScanTime = useRef(Date.now());
    const isProcessing = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('管理員已登入');
            } else {
                toast.error('請前往管理員專區登入！', { autoClose: 2000 });
            }
        });

        const storedPunchType = localStorage.getItem('punchType'); // 從 localStorage 中讀取打卡類型
        if (storedPunchType) {
            setPunchType(storedPunchType);
        }

        return () => {
        // 清理函數
        isProcessing.current = false;
        unsubscribe();
    };
}, []);

    const handleScan = async (data) => {
        const now = Date.now();

        // 避免瞬間感應多次打卡
        if (data && now - lastScanTime.current > 1500 && !isProcessing.current) {
            isProcessing.current = true;
            console.log("QR Code detected: ", data.text);
            setUid(data.text);
            setScanning(false);
            await handlePunch(data.text);
            lastScanTime.current = now;
            setTimeout(() => {
                isProcessing.current = false;
            }, 1500);
        }
    };

    const handleError = (err) => {
        console.error("QR Reader Error: ", err);
        toast.error(`掃描 QR Code 失敗: ${err}`, { autoClose: 2000 });
    };

    const handlePunch = async (uid) => {
        if (punchType === '') {
            toast.error('請選擇打卡類型！', { autoClose: 2000 });
            setScanning(true);
            return;
        }
        // 防呆！奇怪時間打卡的重複確認！
        const currentHour = new Date().getHours();
        if ((currentHour < 9 && punchType === '下班') || (currentHour >= 20 && punchType === '上班')) {
            if (!window.confirm('確定要在這個時間打卡嗎？')) {
                setScanning(true);
                return;
            }
        }

        try {
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                setName(userData.name);

                // 解決五分鐘內重複打卡
                const punchesQuery = query(ref(database, `punches/${uid}`), orderByChild('timestamp'), limitToLast(1));
                const punchesSnapshot = await get(punchesQuery);
                if (punchesSnapshot.exists()) {
                    const lastPunch = Object.values(punchesSnapshot.val())[0];
                    const lastPunchTime = new Date(lastPunch.timestamp);
                    const now = new Date();

                    if ((now - lastPunchTime) < 5 * 60 * 1000) {
                        toast.error('重複打卡，請稍後再試！', { autoClose: 2000 });
                        setScanning(true);
                        return;
                    }
                }

                const punchData = { timestamp: serverTimestamp(), type: punchType };
                const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);
                await set(punchRef, punchData);
                console.log("Punch recorded successfully.");
                toast.success(`${userData.name} 打卡成功！`, { autoClose: 2000 });

            } else {
                toast.error('用戶不存在！', { autoClose: 2000 });
            }

        } catch (error) {
            console.error("Error handling punch: ", error);
            toast.error('打卡過程出現錯誤', { autoClose: 2000 });
        } finally {
            setTimeout(() => {
                setScanning(true);
            }, 1500);
        }
    };

    const handlePunchTypeChange = (e) => {
        const selectedPunchType = e.target.value;
        setPunchType(selectedPunchType);
        localStorage.setItem('punchType', selectedPunchType); // 儲存到local端
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center h-1/3 space-y-6 p-24">
                <h1>管理員登入後才能開啟打卡系統！</h1>
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
                                onChange={handlePunchTypeChange}
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
                                onChange={handlePunchTypeChange}
                            />
                            <label htmlFor="punchTypeEnd" className="ml-2">下班</label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    {scanning && (
                        <div style={{ width: '100%', height: '100%' }}>
                            <QrReader
                                delay={300}
                                onError={handleError}
                                onScan={handleScan}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
