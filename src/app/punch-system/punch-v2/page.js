// */punch-system/punch-v2

'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { database } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';
import { IdleRedirectProvider } from '@/context/redirect-context';

// 動態加載 QrReader 組件，只在客戶端渲染
const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

const sendLineNotify = async (uid, name, punchType) => {
    try {
        const tokenRef = ref(database, `line_tokens/${uid}`);
        const tokenSnapshot = await get(tokenRef);

        if (tokenSnapshot.exists()) {
            const tokenData = tokenSnapshot.val();
            console.log('Token 數據:', tokenData);

            // 獲取第一個子節點的鍵（在這個例子中是 O3GsH-JMPUg-0M8gVpB）
            const firstChildKey = Object.keys(tokenData)[0];

            if (!firstChildKey) {
                throw new Error('未找到 Line Notify token 數據');
            }
            const token = tokenData[firstChildKey].token;

            if (!token) {
                throw new Error('未找到有效的 Line Notify token');
            }

            const message = `${name}已於${new Date().toLocaleString()}${punchType}打卡`;

            console.log('準備發送的消息:', message);
            console.log('使用的 token 的前幾個字符:', token.substring(0, 5) + '...'); // 只顯示 token 的一部分

            const response = await fetch('/api/send-line-notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, token })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '發送 Line Notify 失敗');
            }

            console.log('Line Notify 發送成功');
        } else {
            console.log('找不到該用戶的 Line token');
            throw new Error('找不到該用戶的 Line token');
        }
    } catch (error) {
        console.error('發送 Line Notify 時出錯:', error);
    }
};

export default function Punch() {
    const { isAuthorized, isLoading, userRole } = useIamAccess(['打卡機'], []);
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const [scanning, setScanning] = useState(true);
    const [punchType, setPunchType] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('punchType') || '' : '';
    });
    const lastScanTime = useRef(Date.now());
    const isProcessing = useRef(false);

    useEffect(() => {
        const savedPunchType = localStorage.getItem('punchType');
        if (savedPunchType) {
            setPunchType(savedPunchType);
        }
    }, []);

    const handleScan = useCallback(async (data) => {
        const now = Date.now();

        // 避免瞬間感應多次打卡
        if (data && now - lastScanTime.current > 1500 && !isProcessing.current) {
            isProcessing.current = true;
            setScanning(false); // 立即停止掃描，無論是否有選擇打卡類型
            console.log("QR Code detected: ", data.text);
            setUid(data.text);

            window.dispatchEvent(new Event('userActivity')); // 觸發自定義的qrcode感應事件

            const currentPunchType = localStorage.getItem('punchType') || punchType;
            if (!currentPunchType) {
                toast.error('請選擇打卡類型！', { autoClose: 2000 });
                resetScannerAfterDelay();
                return;
            }

            try {
                await handlePunch(data.text, currentPunchType);
            } catch (error) {
                console.error("Error handling punch: ", error);
                toast.error('打卡過程出現錯誤，請向管理員反映！', { autoClose: 2000 });
            } finally {
                resetScannerAfterDelay();
            }
        }
    }, [punchType]);

    const resetScannerAfterDelay = () => {
        setTimeout(() => {
            setScanning(true);
            lastScanTime.current = Date.now();
            isProcessing.current = false;
        }, 1500);
    };

    const handleError = useCallback((err) => {
        console.error("QR Reader Error: ", err);
        toast.error(`掃描 QR Code 失敗: ${err}`, { autoClose: 2000 });
    }, []);

    const handlePunch = async (uid, currentPunchType) => {
        if (currentPunchType === '') {
            toast.error('請選擇打卡類型！', { autoClose: 2000 });
            return;
        }
        // 特殊打卡時間再次確認
        const currentHour = new Date().getHours();
        if ((currentHour < 10 && currentPunchType === '下班') || (currentHour >= 20 && currentPunchType === '上班')) {
            if (!window.confirm('確定要在這個時間打卡嗎？')) {
                return;
            }
        }

        try {
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                setName(userData.name);
                // 不能五分鐘內重複打卡
                const punchesQuery = query(ref(database, `punches/${uid}`), orderByChild('timestamp'), limitToLast(1));
                const punchesSnapshot = await get(punchesQuery);
                if (punchesSnapshot.exists()) {
                    const lastPunch = Object.values(punchesSnapshot.val())[0];
                    const lastPunchTime = new Date(lastPunch.timestamp);
                    const now = new Date();

                    if ((now - lastPunchTime) < 5 * 60 * 1000) {
                        toast.error('重複打卡，請稍後再試！', { autoClose: 2000 });
                        return;
                    }
                }

                const punchData = { timestamp: serverTimestamp(), type: currentPunchType };
                const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);
                await set(punchRef, punchData);
                console.log("Punch recorded successfully.");
                toast.success(`${userData.name} 打卡成功！`, { autoClose: 2000 });

                // 發送 Line Notify
                await sendLineNotify(uid, userData.name, currentPunchType);

            } else {
                toast.error('用戶不存在！', { autoClose: 2000 });
            }

        } catch (error) {
            throw error; // 將錯誤拋出，讓 handleScan 處理
        }
    };

    const handlePunchTypeChange = (type) => {
        setPunchType(type);
        localStorage.setItem('punchType', type);
    };

    const resetScanner = () => {
        setScanning(false);
        setTimeout(() => setScanning(true), 100);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-between p-24">
                <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
                    <h1 className="text-2xl font-bold">載入中...</h1>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-between p-24">
                <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
                    <h1 className="text-2xl font-bold">管理員須先授權！</h1>
                </div>
            </div>
        );
    }

    return (
        <>
            <IdleRedirectProvider idleTime={1 * 60 * 1000} redirectPath="/punch-system">
                <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                    <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                        <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 打卡機 】</h1>
                        <div className="mb-3 w-full flex flex-col items-center">
                            {/* <label className="text-gray-700 font-bold mb-2">
                            打卡類型: {punchType || '未選擇'}
                        </label> */}
                            <div className="flex space-x-4">
                                {['上班', '下班'].map((type) => (
                                    <button
                                        key={type}
                                        className={`px-4 py-2 rounded ${punchType === type ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                                        onClick={() => handlePunchTypeChange(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center items-center w-full">
                            {scanning && (
                                <div className="w-full h-full">
                                    <QrReader
                                        key={Date.now()} // 強制重新渲染
                                        delay={300}
                                        onError={handleError}
                                        onScan={handleScan}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={resetScanner}
                                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                重置掃描器
                            </button>
                        </div>
                    </div>
                </div>
                <ToastContainer />
            </IdleRedirectProvider>
        </>
    );
}