// */punch-system/query-student-data

'use client';
import React, { useState, useCallback } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function QueryPunch() {
    const { isAuthorized, isLoading, userRole } = useIamAccess(['主管', '老師'], []);
    const [punches, setPunches] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [uid, setUid] = useState('');

    const handleScan = useCallback(async (data) => {
        if (data) {
            setScanning(false);
            const scannedUid = String(data.text);
            setUid(scannedUid);

            try {
                const userRef = ref(database, `users/${scannedUid}`);
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                    toast.success('QR code 辨識成功，已填入 UID', { autoClose: 1500 });
                } else {
                    toast.error('用戶不存在！', { autoClose: 2000 });
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
                toast.error('獲取用戶數據時出錯', { autoClose: 1500 });
            }
        }
    }, []);

    const queryPunches = async (uidToQuery) => {
        try {
            // 首先檢查被查詢的用戶是否為學生
            const userRef = ref(database, `users/${uidToQuery}`);
            const userSnapshot = await get(userRef);

            if (!userSnapshot.exists()) {
                toast.error('找不到該用戶！', { autoClose: 1500 });
                setPunches([]);
                return;
            }

            const userData = userSnapshot.val();
            if (userData.role !== '學生') {
                toast.error('只能查詢學生的打卡記錄！', { autoClose: 1500 });
                setPunches([]);
                return;
            }

            // 如果是學生，則繼續查詢打卡記錄
            const punchesQuery = query(
                ref(database, `punches/${uidToQuery}`),
                orderByChild('timestamp'),
            );

            const punchesSnapshot = await get(punchesQuery);
            if (punchesSnapshot.exists()) {
                const punchesData = Object.values(punchesSnapshot.val()).map(punch => ({
                    ...punch,
                    timestamp: new Date(punch.timestamp).toLocaleString()
                }));
                setPunches(punchesData);
                toast.success('查詢成功！', { autoClose: 1500 });
            } else {
                toast.error('沒有找到打卡記錄！', { autoClose: 2000 });
                setPunches([]);
            }
        } catch (error) {
            console.error("Error querying punches: ", error);
            toast.error('查詢過程出現錯誤', { autoClose: 2000 });
            setPunches([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (uid.trim()) {
            setScanning(false);
            queryPunches(uid.trim());
        } else {
            toast.error('請輸入有效的 UID', { autoClose: 2000 });
        }
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
            <div className="min-h-screen py-2 px-4 flex flex-col items-start justify-start">
                <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 查詢學生報到記錄 】</h1>
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="flex items-center">
                            <input
                                type="text"
                                id="uid"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="請輸入UID"
                                className="p-3 border border-gray-300 text-gray-800 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center"
                                aria-label="查詢"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </button>
                        </div>
                    </form>
                    {scanning ? (
                        <div className='w-full'>
                            <div className="w-full h-full">
                                <QrReader
                                    key={Date.now()}
                                    delay={300}
                                    onError={(err) => {
                                        console.error("QR Reader Error: ", err);
                                        toast.error(`掃描 QR Code 失敗: ${err}`, { autoClose: 2000 });
                                    }}
                                    onScan={handleScan}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <button
                                onClick={() => setScanning(false)}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 mt-2"
                            >
                                關閉掃描器
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            <button
                                onClick={() => setScanning(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-700 hover:to-green-700 hover:scale-105 shadow-lg"
                            >
                                QRcode 掃描
                            </button>
                        </div>
                    )}
                    {punches.length > 0 && (
                        <div className="w-full mt-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg shadow-lg table-mobile">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">日期和時間</th>
                                            <th className="py-3 px-6 text-left">打卡類型</th>
                                            <th className="py-3 px-6 text-left">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm font-light">
                                        {punches.map((punch, index) => {
                                            const prevPunch = index > 0 ? punches[index - 1] : null;
                                            const isOrderIncorrect = prevPunch && prevPunch.type === punch.type;
                                            return (
                                                <React.Fragment key={punch.timestamp}>
                                                    {isOrderIncorrect && (
                                                        <tr className="bg-yellow-100">
                                                            <td colSpan="3" className="py-2 px-6 text-center text-yellow-700">
                                                                警告：連續的{punch.type}打卡可能有誤
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr
                                                        className={`border-b border-gray-200 hover:bg-gray-100 font-semibold ${punch.type === '上班' ? 'bg-green-100' : 'bg-red-100'
                                                            }`}
                                                    >
                                                        <td className="py-3 px-6 text-left whitespace-nowrap">{punch.timestamp}</td>
                                                        <td className="py-3 px-6 text-left">{punch.type}</td>
                                                        <td className="py-3 px-6 text-left">{punch.tag}</td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <ToastContainer />
            </div>
        </>
    );
}