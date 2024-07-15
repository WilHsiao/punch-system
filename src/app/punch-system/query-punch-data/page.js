// */punch-system/query-punch-data

'use client';
import { useState } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild, startAt, endAt } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QueryPunch() {
    const [uid, setUid] = useState('');
    const [date, setDate] = useState('');
    const [punches, setPunches] = useState([]);

    const handleQuery = async () => {
        if (uid.trim() === '' || date.trim() === '') {
            toast.error('請輸入 UID 和月份！', { autoClose: 2000 });
            return;
        }

        const [year, month] = date.split('-');
        const startTimestamp = new Date(`${year}-${month}-01`).getTime();
        const endTimestamp = new Date(year, month, 0, 23, 59, 59).getTime();

        try {
            const punchesQuery = query(
                ref(database, `punches/${uid}`),
                orderByChild('timestamp'),
                startAt(startTimestamp),
                endAt(endTimestamp)
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

    return (
        <>
            <div className="min-h-screen flex items-center justify-center">
                <div
                    className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-lg shadow-lg w-full max-w-xl"
                    style={{ marginTop: '-20%' }}
                >
                    <h1 className="text-2xl font-bold text-gray-700">【 查詢打卡記錄 】</h1>
                    <input
                        type="text"
                        placeholder="輸入 UID"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        className="p-2 border border-gray-300 text-gray-700 rounded w-full"
                    />
                    <input
                        type="month"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="選擇年份和月份"
                        className="p-2 border border-gray-300 text-gray-700 rounded w-full mt-2"
                    />
                    <button
                        onClick={handleQuery}
                        className="bg-blue-500 text-white p-2 rounded w-full font-bold mt-2"
                    >
                        查詢
                    </button>
                    {punches.length > 0 && (
                        <div className="w-full mt-4">
                            <h2 className="text-xl font-bold text-gray-700 mb-4">打卡記錄</h2>
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
            </div>
            <ToastContainer />
        </>
    );
}
