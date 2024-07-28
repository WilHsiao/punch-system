'use client';
import { useState } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function QueryPunch() {
    const { isAuthorized, isLoading } = useIamAccess();
    const [punches, setPunches] = useState([]);
    const [scanning, setScanning] = useState(true);
    const [lastScanned, setLastScanned] = useState(null);

    const handleScan = async (data) => {
        if (data && data !== lastScanned) {
            const uid = typeof data === 'object' ? data.text : data;
            setLastScanned(data);
            setScanning(false);
            await queryPunches(uid);
        }
    };

    const queryPunches = async (uid) => {
        try {
            const punchesQuery = query(
                ref(database, `punches/${uid}`),
                orderByChild('timestamp'),
            );

            const punchesSnapshot = await get(punchesQuery);
            if (punchesSnapshot.exists()) {
                const punchesData = Object.values(punchesSnapshot.val()).map(punch => ({
                    ...punch,
                    timestamp: new Date(punch.timestamp).toLocaleString()
                }));
                setPunches(punchesData);
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

    const handleError = (err) => {
        console.error(err);
        toast.error('QR碼掃描錯誤', { autoClose: 2000 });
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
        <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
              <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-700 text-center">【 查詢打卡記錄 】</h1>
                {scanning ? (
                    <div className="w-full">
                        <QrReader
                            delay={300}
                            onError={handleError}
                            onScan={handleScan}
                            style={{ width: '100%' }}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setScanning(true);
                            setLastScanned(null);
                        }}
                        className="bg-green-500 text-white p-2 rounded w-full font-bold mt-2"
                    >
                        重新掃描
                    </button>
                )}
                {punches.length > 0 && (
                    <div className="w-full mt-4">
                        <h2 className="text-xl font-bold text-center text-gray-700 mb-4">打卡記錄</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg shadow-lg">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">日期和時間</th>
                                        <th className="py-3 px-6 text-left">打卡類型</th>
                                        <th className="py-3 px-6 text-left">備註</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm font-light">
                                    {punches.map((punch, index) => (
                                        <tr
                                            key={index}
                                            className={`border-b border-gray-200 hover:bg-gray-100 font-semibold ${
                                                punch.type === '上班' ? 'bg-green-100' : 'bg-red-100'
                                            }`}
                                        >
                                            <td className="py-3 px-6 text-left whitespace-nowrap">{punch.timestamp}</td>
                                            <td className="py-3 px-6 text-left">{punch.type}</td>
                                            <td className="py-3 px-6 text-left">{punch.tag}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}