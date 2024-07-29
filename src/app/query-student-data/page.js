// */punch-system/query-punch-data

'use client';
import { useState } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function QueryPunch() {
    const [punches, setPunches] = useState([]);
    const [scanning, setScanning] = useState(true);
    const [lastScanned, setLastScanned] = useState(null);

    const handleScan = async (data) => {
        if (data && data !== lastScanned) {
            console.log(data.text);
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

    return (
        <>
            <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 查詢學生報到記錄 】</h1>
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
                                        {punches.map((punch, index) => {
                                            const prevPunch = index > 0 ? punches[index - 1] : null;
                                            const isOrderIncorrect = prevPunch && prevPunch.type === punch.type;

                                            return (
                                                <>
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
                                                </>
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